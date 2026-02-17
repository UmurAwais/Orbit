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
    this.tabStates.set(id, { lastActive: Date.now(), isHibernated: false, isLoading: false });

    this.setupEvents(id, view);
    const targetUrl = url === 'about:blank' ? 'about:blank' : (url || 'https://www.google.com');
    view.webContents.loadURL(targetUrl);

    return view;
  }

  setupEvents(id, view) {
    const wc = view.webContents;
    
    const sendStatus = () => {
      const tabState = this.tabStates.get(id);
      this.sendToUI('tab:update', { 
        id, 
        isLoading: tabState?.isLoading ?? false,
        url: wc.getURL(), 
        title: wc.getTitle(),
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
      // If we're navigating to a real page, make sure the view is attached instantly
      if (url !== 'about:blank' && id === this.activeViewId) {
        this.mainWindow.contentView.addChildView(view);
        this.updateLayout();
      }
      const state = this.tabStates.get(id);
      if (state) state.isLoading = true;
      sendStatus();
    });

    wc.on('page-title-updated', (e, title) => {
      const state = this.tabStates.get(id);
      if (state) state.isLoading = false;
      sendStatus();
    });
  }

  selectView(id) {
    if (this.activeViewId === id) {
       // If same view, check if we need to attach it (in case it just started navigating)
       const view = this.views.get(id);
       if (view && view.webContents.getURL() !== 'about:blank') {
         this.mainWindow.contentView.addChildView(view);
         this.updateLayout();
       }
       return;
    }

    // Remove current active view from window
    if (this.activeViewId && this.views.has(this.activeViewId)) {
      try { this.mainWindow.contentView.removeChildView(this.views.get(this.activeViewId)); } catch(e) {}
    }

    this.activeViewId = id;
    const view = this.views.get(id);

    if (view) {
      // Check current URL. If it's the start page, keep view detached.
      const wc = view.webContents;
      const currentUrl = wc.getURL();
      
      if (currentUrl && currentUrl !== 'about:blank' && currentUrl !== '') {
        this.mainWindow.contentView.addChildView(view);
      } else {
        // Ensure it is detached if it's about:blank
        try { this.mainWindow.contentView.removeChildView(view); } catch(e) {}
      }

      this.tabStates.get(id).lastActive = Date.now();
      
      // Wake if hibernated
      if (this.tabStates.get(id).isHibernated) {
        view.webContents.setAudioMuted(false);
        this.tabStates.get(id).isHibernated = false;
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
    const url = view.webContents.getURL();

    // If it's a real page, attach and show it full-bleed
    if (url && url !== 'about:blank' && url !== '') {
      this.mainWindow.contentView.addChildView(view);
      view.setBounds({ x: 0, y: 92, width, height: height - 92 });
    } else {
      // It's the start page, ensure it's removed so React can show through
      try { this.mainWindow.contentView.removeChildView(view); } catch (e) {}
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
