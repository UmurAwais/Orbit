import { BrowserWindow, WebContentsView, ipcMain } from 'electron';

export class ViewManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.views = new Map(); // id -> WebContentsView
    this.activeViewId = null;
    this.tabStates = new Map(); // id -> { lastActive: timestamp, isHibernated: bool, isLoading: bool }
    this.isOverview = false;
    
    this.HIBERNATE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    this.setupHibernation();
  }

  createView(id, url) {
    // Prevent duplicate views for the same ID - this is a primary source of memory leaks
    if (this.views.has(id)) {
      console.warn(`[Orbit Engine] View ${id} already exists. Reusing existing view.`);
      const existing = this.views.get(id);
      if (url && url !== 'about:blank') existing.webContents.loadURL(url);
      return existing;
    }

    const view = new WebContentsView({
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        partition: `persist:tab-${id}`,
        backgroundThrottling: true,
      }
    });

    this.views.set(id, view);
    try {
      view.setBackgroundColor('#ffffff'); // Set on the view object, not webContents
    } catch (e) {
      console.warn('Failed to set background color on view', e);
    }
    this.tabStates.set(id, { lastActive: Date.now(), isHibernated: false, isLoading: false, lastUrl: url || 'about:blank' });

    this.setupEvents(id, view);
    this.injectContextMenu(view.webContents); // Inject Safari-style context menu
    const targetUrl = url === 'about:blank' ? 'about:blank' : (url || 'https://www.google.com');
    view.webContents.loadURL(targetUrl);

    return view;
  }

  sendStatus(id) {
    const view = this.views.get(id);
    if (!view) return;
    const wc = view.webContents;
    const tabState = this.tabStates.get(id);
    const currentUrl = wc.getURL();
    
    // Robust URL reporting: during navigation transitions, currentUrl can be empty.
    // We use the most recent intended URL (lastUrl) to prevent the UI from 
    // flickering back to the 'New Tab' state while a page is still loading.
    let urlToSend = currentUrl;
    const isCurrentlyEmpty = !currentUrl || currentUrl === 'about:blank';
    
    if (isCurrentlyEmpty && tabState?.lastUrl && tabState.lastUrl !== 'about:blank') {
      urlToSend = tabState.lastUrl;
    } else if (!isCurrentlyEmpty) {
      // Sync the known lastUrl with reality
      if (tabState) tabState.lastUrl = currentUrl;
    } else if (tabState?.lastUrl) {
      urlToSend = tabState.lastUrl;
    } else {
      urlToSend = 'about:blank';
    }
    
    let displayTitle = wc.getTitle();
    const isTitleInvalid = !displayTitle || 
                          displayTitle === 'about:blank' || 
                          displayTitle === 'New Tab' || 
                          displayTitle === 'Loading...' || 
                          displayTitle === '';

    if (urlToSend === 'about:blank') {
      displayTitle = 'New Tab';
    } else if (isTitleInvalid) {
      if (urlToSend && urlToSend !== 'about:blank') {
        try {
          const hostname = new URL(urlToSend).hostname.replace('www.', '');
          displayTitle = hostname.charAt(0).toUpperCase() + hostname.slice(1);
        } catch (e) {
          displayTitle = 'Loading...';
        }
      } else {
        displayTitle = 'New Tab';
      }
    }

    this.sendToUI('tab:update', { 
      id, 
      isLoading: tabState?.isLoading ?? false,
      url: urlToSend, 
      title: displayTitle,
      favicon: tabState?.favicon,
      preview: tabState?.preview,
      canGoBack: wc.navigationHistory?.canGoBack() ?? wc.canGoBack() ?? false,
      canGoForward: wc.navigationHistory?.canGoForward() ?? wc.canGoForward() ?? false,
      zoomFactor: wc.getZoomFactor(),
    });
  }

  captureThumbnail(id) {
    const view = this.views.get(id);
    if (!view || view.webContents.isDestroyed()) return;
    
    const wc = view.webContents;
    // Don't capture about:blank or extremely small pages
    if (!wc.getURL() || wc.getURL() === 'about:blank' || wc.isLoading()) return;

    // Throttle captures to once every 2 seconds per tab to prevent heap corruption
    const state = this.tabStates.get(id);
    const now = Date.now();
    if (state.lastCapture && now - state.lastCapture < 2000) return;
    state.lastCapture = now;

    // Small extra delay to ensure the page has painted at least once
    setTimeout(async () => {
      try {
        if (wc.isDestroyed()) return;
        const image = await wc.capturePage();
        if (image.isEmpty()) return;

        const state = this.tabStates.get(id);
        if (state) {
          // 400px width is perfect for the grid; preserves quality while keeping state size in check
          state.preview = image.resize({ width: 400 }).toDataURL();
          this.sendStatus(id);
        }
      } catch (e) {
        console.error('[Orbit Engine] Thumbnail capture failed:', e);
      }
    }, 800);
  }

  setupEvents(id, view) {
    const wc = view.webContents;
    
    this.activeIntervals = this.activeIntervals || new Map();
    if (this.activeIntervals.has(id)) clearInterval(this.activeIntervals.get(id));

    // Poll for Orbit actions (Context Menu commands)
    const checkOrbitActions = setInterval(() => {
      if (wc.isDestroyed()) {
        clearInterval(checkOrbitActions);
        this.activeIntervals.delete(id);
        return;
      }
      wc.executeJavaScript(`
        (function() {
          const actions = window.__orbitActions || [];
          window.__orbitActions = [];
          if (window.__orbitOpenDevTools) {
             window.__orbitOpenDevTools = false;
             actions.push({ action: 'inspect' });
          }
          return actions;
        })()
      `).then(actions => {
        if (!actions || !Array.isArray(actions)) return;
        actions.forEach(item => {
          const { action, data } = item;
          switch (action) {
            case 'back': wc.navigationHistory?.goBack(); break;
            case 'forward': wc.navigationHistory?.goForward(); break;
            case 'reload': wc.reload(); break;
            case 'inspect': wc.openDevTools({ mode: 'bottom' }); break;
            case 'savePage': wc.downloadURL(wc.getURL()); break;
            case 'screenshot': this.mainWindow.webContents.send('capture-page'); break;
          }
        });
      }).catch(() => {});
    }, 200);

    this.activeIntervals.set(id, checkOrbitActions);

    wc.on('destroyed', () => {
      if (this.activeIntervals.has(id)) {
        clearInterval(this.activeIntervals.get(id));
        this.activeIntervals.delete(id);
      }
    });
    
    wc.on('did-start-loading', () => {
      const state = this.tabStates.get(id);
      if (state) state.isLoading = true;
      this.sendStatus(id);
    });
    
    wc.on('did-stop-loading', () => {
      const state = this.tabStates.get(id);
      if (state) state.isLoading = false;
      this.sendStatus(id);
      this.captureThumbnail(id);
    });
    
    wc.on('did-finish-load', () => {
      const state = this.tabStates.get(id);
      if (state) {
        state.isLoading = false;
        state.lastUrl = wc.getURL();
      }
      this.sendStatus(id);
      if (id === this.activeViewId) {
        this.updateLayout();
      }
      this.captureThumbnail(id);
    });
    
    wc.on('did-start-navigation', (e, url) => {
      const state = this.tabStates.get(id);
      if (state) { state.isLoading = true; state.lastUrl = url; }
      if (id === this.activeViewId) this.updateLayout();
      this.sendStatus(id);
    });

    wc.on('did-navigate', (e, url) => {
      const state = this.tabStates.get(id);
      if (state) { state.isLoading = false; state.lastUrl = url; }
      this.sendStatus(id);
    });

    wc.on('page-title-updated', () => this.sendStatus(id));
    wc.on('page-favicon-updated', (e, favicons) => {
      const state = this.tabStates.get(id);
      if (state && favicons?.[0]) { state.favicon = favicons[0]; }
      this.sendStatus(id);
    });

    wc.on('did-change-theme-color', () => this.sendStatus(id));

    wc.on('update-target-url', (event, url) => {
      const script = `
        (function() {
          let bubble = document.getElementById('orbit-link-preview');
          if (!bubble) {
            bubble = document.createElement('div');
            bubble.id = 'orbit-link-preview';
            Object.assign(bubble.style, {
              position: 'fixed', bottom: '0', left: '0', maxWidth: '600px',
              padding: '2px 8px', backgroundColor: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(60px) saturate(210%) brightness(1.05)',
              borderTopRightRadius: '5px', border: '1px solid rgba(255, 255, 255, 0.4)',
              color: '#1d1d1f', fontSize: '11px', zIndex: '2147483647',
              pointerEvents: 'none', opacity: '0', transition: 'opacity 0.1s ease-in-out'
            });
            document.body.appendChild(bubble);
          }
          if ("${url}") { bubble.textContent = "${url}"; bubble.style.opacity = '1'; }
          else { bubble.style.opacity = '0'; }
        })();
      `;
      wc.executeJavaScript(script).catch(() => {});
    });

    this.sendStatus(id);
  }

  // Inject Safari-style context menu into webpage
  injectContextMenu(webContents) {
    webContents.on('did-finish-load', () => {
      const script = `
        (function() {
          if (window.__orbitContextMenuInjected) return;
          window.__orbitContextMenuInjected = true;
          
          console.log('[Orbit] Context menu injected');
          
          document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const params = {
              x: e.clientX,
              y: e.clientY,
              selectionText: window.getSelection().toString(),
              isEditable: e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA',
              linkURL: e.target.closest('a')?.href || '',
              srcURL: e.target.tagName === 'IMG' ? e.target.src : '',
              mediaType: e.target.tagName === 'IMG' ? 'image' : ''
            };
            
            showContextMenu(params);
          }, true);
          
          function showContextMenu(params) {
            const existing = document.getElementById('orbit-context-menu');
            if (existing) existing.remove();
            
            const items = [];
            const hasSelection = !!params.selectionText;
            const isEditable = params.isEditable;
            const isLink = !!params.linkURL;
            const isImage = !!params.srcURL;
            
            // Safari macOS menu structure
            items.push({ label: 'Back', action: 'back' });
            items.push({ label: 'Forward', action: 'forward' });
            items.push({ label: 'Reload', action: 'reload' });
            items.push({ type: 'separator' });
            
            if (isLink) {
              items.push({ label: 'Open Link in New Tab', action: 'openLink', data: params.linkURL });
              items.push({ label: 'Download Linked File', action: 'downloadLink', data: params.linkURL });
              items.push({ label: 'Copy Link', action: 'copyLink', data: params.linkURL });
              items.push({ type: 'separator' });
            }
            
            if (isImage) {
              items.push({ label: 'Open Image in New Tab', action: 'openImage', data: params.srcURL });
              items.push({ label: 'Add Image to Photos', action: 'addToPhotos', data: params.srcURL });
              items.push({ label: 'Copy Image', action: 'copyImage', data: params.srcURL });
              items.push({ type: 'separator' });
            }
            
            if (hasSelection) {
              items.push({ label: 'Copy', action: 'copy' });
              items.push({ label: 'Look Up "' + params.selectionText.substring(0, 20) + (params.selectionText.length > 20 ? '...' : '') + '"', action: 'lookup', data: params.selectionText });
              items.push({ label: 'Search with Google', action: 'search', data: params.selectionText });
              items.push({ label: 'Share...', action: 'share', data: params.selectionText });
              items.push({ type: 'separator' });
            }
            
            items.push({ label: 'Inspect Element', action: 'inspect' });
            
            if (items[items.length - 1]?.type === 'separator') items.pop();
            
            const menu = document.createElement('div');
            menu.id = 'orbit-context-menu';
            Object.assign(menu.style, {
              position: 'fixed',
              top: params.y + 'px',
              left: params.x + 'px',
              zIndex: '2147483647',
              minWidth: '180px',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(60px) saturate(210%) brightness(1.05)',
              webkitBackdropFilter: 'blur(60px) saturate(210%) brightness(1.05)',
              borderRadius: '12px',
              padding: '6px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.5) inset',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
              fontSize: '13px',
              fontWeight: '400',
              color: '#1d1d1f',
              opacity: '0',
              transform: 'scale(0.95)',
              transition: 'opacity 0.12s cubic-bezier(0.2, 0, 0, 1), transform 0.12s cubic-bezier(0.2, 0, 0, 1)',
              userSelect: 'none',
              pointerEvents: 'auto',
              border: 'none'
            });
            
            items.forEach(item => {
              if (item.type === 'separator') {
                const sep = document.createElement('div');
                sep.style.cssText = 'height: 0.5px; background: rgba(0, 0, 0, 0.08); margin: 6px 10px;';
                menu.appendChild(sep);
              } else {
                const div = document.createElement('div');
                div.textContent = item.label;
                
                div.style.cssText = \`
                  padding: 5px 12px;
                  borderRadius: 5px;
                  cursor: default;
                  transition: all 0.1s ease-out;
                  fontSize: 13px;
                  lineHeight: 1.5;
                  color: '#1d1d1f',
                  fontWeight: '400',
                \`;
                
                div.onmouseenter = () => {
                  div.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                };
                div.onmouseleave = () => {
                  div.style.backgroundColor = 'transparent';
                };
                div.onclick = (e) => {
                  e.stopPropagation();
                  handleAction(item, params);
                  closeMenu();
                };
                
                menu.appendChild(div);
              }
            });
            
            document.body.appendChild(menu);
            
            requestAnimationFrame(() => {
              menu.style.opacity = '1';
              menu.style.transform = 'scale(1)';
            });
            
            const rect = menu.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
              menu.style.left = 'auto';
              menu.style.right = (window.innerWidth - params.x) + 'px';
            }
            if (rect.bottom > window.innerHeight) {
              menu.style.top = 'auto';
              menu.style.bottom = (window.innerHeight - params.y) + 'px';
            }
            
            function closeMenu() {
              menu.style.opacity = '0';
              menu.style.transform = 'scale(0.9)';
              setTimeout(() => menu.remove(), 200);
            }
            
            setTimeout(() => {
              document.addEventListener('click', closeMenu, { once: true });
              document.addEventListener('contextmenu', closeMenu, { once: true });
              window.addEventListener('scroll', closeMenu, { once: true, capture: true });
            }, 100);
            
            function handleAction(item, params) {
              const action = item.action;
              
              // Backend handled actions
              const backendActions = ['back', 'forward', 'reload', 'inspect', 'savePage', 'screenshot', 'viewSource'];
              if (backendActions.includes(action)) {
                window.__orbitActions = window.__orbitActions || [];
                window.__orbitActions.push({ action, data: item.data });
                return;
              }
              
              // Frontend handled actions
              if (action === 'cut') document.execCommand('cut');
              else if (action === 'copy') document.execCommand('copy');
              else if (action === 'paste') document.execCommand('paste');
              else if (action === 'selectAll') document.execCommand('selectAll');
              else if (action === 'search') {
                window.open('https://www.google.com/search?q=' + encodeURIComponent(item.data), '_blank');
              }
              else if (action === 'lookup') {
                window.open('https://www.google.com/search?q=define+' + encodeURIComponent(item.data), '_blank');
              }
              else if (action === 'share') {
                if (navigator.share) {
                  navigator.share({ title: document.title, url: window.location.href });
                }
              }
              else if (action === 'openLink' || action === 'openImage') {
                window.open(item.data, '_blank');
              }
              else if (action === 'copyLink' || action === 'copyImage') {
                navigator.clipboard.writeText(item.data).catch(() => {});
              }
            }
          }
        })();
      `;
      
      webContents.executeJavaScript(script).catch(err => {
        console.error('[Orbit] Failed to inject context menu:', err);
      });
    });
  }

  selectView(id) {
    if (this.activeViewId === id) {
       this.updateLayout();
       return;
    }

    // Hide old view
    if (this.activeViewId && this.views.has(this.activeViewId)) {
      try {
        const oldView = this.views.get(this.activeViewId);
        this.mainWindow.contentView.removeChildView(oldView);
      } catch(e) {}
    }

    this.activeViewId = id;
    const view = this.views.get(id);

    if (view) {
      const state = this.tabStates.get(id);
      state.lastActive = Date.now();
      
      // Wake if hibernated
      if (state.isHibernated) {
        view.webContents.setAudioMuted(false);
        state.isHibernated = false;
      }
      
      this.updateLayout();
    }
  }

  closeView(id) {
    const view = this.views.get(id);
    if (view) {
      if (this.activeViewId === id) {
        this.mainWindow.contentView.removeChildView(view);
        this.activeViewId = null;
      }
      view.webContents.destroy();
      this.views.delete(id);
      this.tabStates.delete(id);
    }
  }

  updateLayout() {
    if (!this.mainWindow || !this.activeViewId) return;
    const view = this.views.get(this.activeViewId);
    if (!view) return;

    const [width, height] = this.mainWindow.getContentSize();
    const wc = view.webContents;
    const tabState = this.tabStates.get(this.activeViewId);
    
    // Prioritize lastUrl during navigation phases to prevent UI flickering
    const currentUrl = wc.getURL();
    const targetUrl = (currentUrl && currentUrl !== 'about:blank') ? currentUrl : (tabState?.lastUrl || 'about:blank');
    
    const isLoading = tabState?.isLoading || wc.isLoading();
    const isNewTab = targetUrl === 'about:blank' && !isLoading;
    const shouldShowBrowser = !isNewTab && !this.isOverview;

    if (shouldShowBrowser) {
      // Force the view to be ON TOP of the React UI to prevent occlusion
      try {
        const children = this.mainWindow.contentView.children || [];
        if (!children.includes(view)) {
          this.mainWindow.contentView.addChildView(view);
          view.setBackgroundColor('#ffffff');
        }
      } catch (e) {}
      
      // Offset by 48px to match the new centralized header height
      view.setBounds({ x: 0, y: 48, width, height: height - 48 });
      if (this.mainWindow.isFocused()) {
        // Only focus webContents if the window itself is active to avoid hijacking
        // wc.focus() can sometimes trigger re-paints in certain GPU environments
      }
    } else {
      // Hide for New Tab page
      try {
        const children = this.mainWindow.contentView.children || [];
        if (children.includes(view)) {
          this.mainWindow.contentView.removeChildView(view);
        }
      } catch (e) {}
    }
  }

  setupHibernation() {
    setInterval(() => {
      const now = Date.now();
      this.tabStates.forEach((state, id) => {
        if (id !== this.activeViewId && !state.isHibernated && (now - state.lastActive > this.HIBERNATE_THRESHOLD)) {
          const view = this.views.get(id);
          if (view) {
            view.webContents.setAudioMuted(true);
            // Stopping rendering happens via lack of visibility/addChildView
            state.isHibernated = true;
            console.log(`[Orbit Engine] Hibernating tab ${id} to save memory.`);
          }
        }
      });
    }, 60000);
  }

  sendToUI(channel, data) {
    if (this.mainWindow) {
      this.mainWindow.webContents.send(channel, data);
    }
  }
}
