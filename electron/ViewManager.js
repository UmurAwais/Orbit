import { BrowserWindow, WebContentsView, ipcMain } from 'electron';

export class ViewManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.views = new Map(); // id -> WebContentsView
    this.activeViewId = null;
    this.tabStates = new Map(); // id -> { lastActive: timestamp, isHibernated: bool, isLoading: bool }
    
    this.HIBERNATE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    this.setupHibernation();
  }

  createView(id, url) {
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
    this.tabStates.set(id, { lastActive: Date.now(), isHibernated: false, isLoading: false, lastUrl: url });

    this.setupEvents(id, view);
    const targetUrl = url === 'about:blank' ? 'about:blank' : (url || 'https://www.google.com');
    view.webContents.loadURL(targetUrl);

    return view;
  }

  setupEvents(id, view) {
    const wc = view.webContents;
    
    const sendStatus = () => {
      const tabState = this.tabStates.get(id);
      const currentUrl = wc.getURL();
      
      const urlToSend = (currentUrl === '' || currentUrl === 'about:blank') && tabState?.lastUrl && tabState.lastUrl !== 'about:blank'
        ? tabState.lastUrl
        : currentUrl;
      
      let displayTitle = wc.getTitle();
      
      // If title is missing or still says 'New Tab' but we have a real URL, ignore it
      const isTitleInvalid = !displayTitle || displayTitle === 'about:blank' || displayTitle === 'New Tab' || displayTitle === '';
      const isActuallyNewTab = urlToSend === 'about:blank';

      if (isTitleInvalid && !isActuallyNewTab) {
        if (urlToSend && urlToSend !== 'about:blank') {
          try {
            displayTitle = new URL(urlToSend).hostname.replace('www.', '');
          } catch (e) {
            displayTitle = 'Loading...';
          }
        } else {
          displayTitle = 'New Tab';
        }
      } else if (!displayTitle) {
        displayTitle = 'New Tab';
      }

      this.sendToUI('tab:update', { 
        id, 
        isLoading: tabState?.isLoading ?? false,
        url: urlToSend, 
        title: displayTitle,
        canGoBack: wc.navigationHistory?.canGoBack() ?? false,
        canGoForward: wc.navigationHistory?.canGoForward() ?? false,
      });
    };

    wc.on('did-start-loading', () => {
      const state = this.tabStates.get(id);
      if (state) state.isLoading = true;
      sendStatus();
    });
    
    wc.on('did-stop-loading', () => {
      const state = this.tabStates.get(id);
      if (state) state.isLoading = false;
      sendStatus();
    });
    
    wc.on('did-finish-load', () => {
      const state = this.tabStates.get(id);
      if (state) state.isLoading = false;
      sendStatus();
    });
    
    wc.on('dom-ready', () => {
      const state = this.tabStates.get(id);
      if (state) state.isLoading = false;
      sendStatus();
    });
    
    wc.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (isMainFrame) {
        const state = this.tabStates.get(id);
        if (state) state.isLoading = false;
        sendStatus();
      }
    });
    
    wc.on('did-navigate', () => sendStatus());
    wc.on('did-navigate-in-page', () => sendStatus());
    
    wc.on('did-start-navigation', (e, url) => {
      const state = this.tabStates.get(id);
      if (state) {
        state.isLoading = true;
        // Anti-Regression: Only set lastUrl to blank if it's the very first URL
        if (url !== 'about:blank' || !state.lastUrl || state.lastUrl === '') {
          state.lastUrl = url;
        }
      }
      
      // If navigating to a real URL, show the view immediately
      if (id === this.activeViewId) {
        this.updateLayout();
      }
      sendStatus();
    });

    wc.on('did-navigate', (e, url) => {
      const state = this.tabStates.get(id);
      if (state) {
        if (url !== 'about:blank' || !state.lastUrl) {
          state.lastUrl = url;
        }
      }
      sendStatus();
      if (id === this.activeViewId) this.updateLayout();
    });

    wc.on('page-title-updated', (e, title) => {
      const state = this.tabStates.get(id);
      if (state) state.isLoading = false;
      sendStatus();
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
    const state = this.tabStates.get(this.activeViewId);
    
    // Show browser view if we have EVER navigated away from about:blank
    // Once you navigate somewhere, keep showing the browser view
    const shouldShowBrowser = state?.lastUrl && state.lastUrl !== 'about:blank';

    if (shouldShowBrowser) {
      // Show the native browser view
      try {
        const children = this.mainWindow.contentView.children || [];
        if (!children.includes(view)) {
          this.mainWindow.contentView.addChildView(view);
        }
      } catch (e) {}
      
      // Triple Layer Header Height (Tabs: 44px + Address: 48px + Bookmarks: 40px = 132px)
      view.setBounds({ x: 0, y: 132, width, height: Math.max(0, height - 132) });
    } else {
      // Show the React NewTab page
      try {
        this.mainWindow.contentView.removeChildView(view);
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
