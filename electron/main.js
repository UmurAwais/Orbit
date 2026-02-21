import { app, BaseWindow, WebContentsView, ipcMain, Menu, shell, nativeTheme, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { ViewManager } from './ViewManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let uiView;      // WebContentsView for the React browser UI — always on top
let viewManager;

function createWindow() {
  // Use BaseWindow so we control ALL child view z-ordering manually.
  // With BrowserWindow, the built-in webContents is always the BOTTOM layer and
  // WebContentsViews added via addChildView always render on top of it — making
  // it impossible for HTML dropdowns to appear above web page content.
  // With BaseWindow + a dedicated uiView added LAST, the React UI is always on top.
  mainWindow = new BaseWindow({
    width: 1400,
    height: 900,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: nativeTheme.shouldUseDarkColors ? '#000000' : '#ffffff',
      symbolColor: nativeTheme.shouldUseDarkColors ? '#f5f5f7' : '#1d1d1f',
      height: 46
    },
    icon: path.join(__dirname, '../assets/orbit.png'),
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#000000' : '#ffffff',
    show: false,
  });

  // Create the React UI view — this is the browser chrome (header, tabs, dropdowns)
  uiView = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // preload needs access to node path apis
    },
  });

  // Transparent background so the page content shows through the parts of the
  // UI that have no opaque elements (below the header area)
  uiView.setBackgroundColor('#00000000');

  // Add uiView now (will be re-raised after every page view addition)
  mainWindow.contentView.addChildView(uiView);

  // Size the UI view to cover the full window initially
  const [w, h] = mainWindow.getContentSize();
  uiView.setBounds({ x: 0, y: 0, width: w, height: h });

  // ViewManager manages page WebContentsViews.
  // Pass uiView so it can re-raise it to the top after adding each page view.
  viewManager = new ViewManager(mainWindow, uiView);

  // Load the React app in uiView
  if (process.env.VITE_DEV_SERVER_URL) {
    uiView.webContents.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    uiView.webContents.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('resize', () => {
    const [width, height] = mainWindow.getContentSize();
    // Only resize uiView if it's currently at full height (Orbit UI mode)
    // If it's at header-only height, keep it that way until navigating back
    const bounds = uiView.getBounds();
    const isHeaderOnly = bounds.height <= 96;
    uiView.setBounds({ x: 0, y: 0, width, height: isHeaderOnly ? 92 : height });
    viewManager.updateLayout();
  });

  uiView.webContents.once('did-finish-load', () => {
    mainWindow.show();
    if (viewManager) viewManager.updateLayout();
  });

  setupIpcHandlers();
  setupApplicationMenu();

  nativeTheme.on('updated', () => {
    const isDark = nativeTheme.shouldUseDarkColors;
    mainWindow.setTitleBarOverlay({
      color: isDark ? '#000000' : '#ffffff',
      symbolColor: isDark ? '#f5f5f7' : '#1d1d1f',
      height: 46
    });
    mainWindow.setBackgroundColor(isDark ? '#000000' : '#ffffff');
  });
}

function setupApplicationMenu() {
  const template = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload active page',
          accelerator: 'CmdOrCtrl+R',
          click: () => viewManager.views.get(viewManager.activeViewId)?.webContents.reload()
        },
        {
          label: 'Force reload active page',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => viewManager.views.get(viewManager.activeViewId)?.webContents.reloadIgnoringCache()
        },
        {
          label: 'Inspect active page',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => viewManager.views.get(viewManager.activeViewId)?.webContents.toggleDevTools()
        },
        {
          label: 'Inspect Browser UI',
          accelerator: 'Alt+Shift+I',
          click: () => uiView?.webContents.toggleDevTools()
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function setupIpcHandlers() {
  ipcMain.on('theme:update', (event, theme) => {
    nativeTheme.themeSource = theme;
  });

  ipcMain.handle('tab:create', (event, { id, url }) => {
    viewManager.createView(id, url);
    return { id };
  });

  ipcMain.handle('tab:select', (event, { id }) => {
    viewManager.selectView(id);
    return { success: true };
  });

  ipcMain.handle('tab:close', (event, { id }) => {
    viewManager.closeView(id);
    return { success: true };
  });

  ipcMain.handle('tab:navigate', (event, { id, url }) => {
    console.log('[main.js] tab:navigate called:', { id, url });
    const view = viewManager.views.get(id);
    if (view) {
      let targetUrl = url;
      const hasProtocol = /^([a-z][a-z0-9+\-.]*):/i.test(url);
      const hasSpace = url.includes(' ');
      const isLocalhost = /^localhost(:\d+)?$/i.test(url);
      const isIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(url);
      const hasExtension = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?([/?#].*)?$/.test(url);

      if (!hasProtocol) {
        if (isLocalhost || isIP) {
          targetUrl = `http://${url}`;
        } else if (hasExtension && !hasSpace) {
          targetUrl = `https://${url}`;
        } else {
          targetUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
        }
      }

      const state = viewManager.tabStates.get(id);
      if (state) state.lastUrl = targetUrl;

      view.webContents.loadURL(targetUrl);

      if (viewManager.activeViewId === id && url !== 'about:blank') {
        viewManager.updateLayout();
      }
    } else {
      console.error('[main.js] View not found for id:', id);
    }
  });

  ipcMain.handle('tab:reload', (event, { id }) => {
    return viewManager.views.get(id)?.webContents.reload();
  });

  ipcMain.handle('tab:stop', (event, { id }) => {
    const view = viewManager.views.get(id);
    if (view) {
      view.webContents.stop();
      const state = viewManager.tabStates.get(id);
      if (state) {
        state.isLoading = false;
        viewManager.sendToUI('tab:update', {
          id,
          isLoading: false,
          url: view.webContents.getURL(),
          title: view.webContents.getTitle(),
          canGoBack: view.webContents.navigationHistory?.canGoBack() ?? view.webContents.canGoBack() ?? false,
          canGoForward: view.webContents.navigationHistory?.canGoForward() ?? view.webContents.canGoForward() ?? false,
        });
      }
    }
  });

  ipcMain.handle('tab:goBack', (event, { id }) => {
    const wc = viewManager.views.get(id)?.webContents;
    if (wc) {
      if (wc.navigationHistory) wc.navigationHistory.goBack();
      else if (wc.canGoBack()) wc.goBack();
    }
  });

  ipcMain.handle('tab:goForward', (event, { id }) => {
    const wc = viewManager.views.get(id)?.webContents;
    if (wc) {
      if (wc.navigationHistory) wc.navigationHistory.goForward();
      else if (wc.canGoForward()) wc.goForward();
    }
  });

  ipcMain.on('ui:toggle-overview', (event, isOverview) => {
    viewManager.isOverview = isOverview;
    if (isOverview && viewManager.activeViewId) {
      viewManager.captureThumbnail(viewManager.activeViewId);
      try { mainWindow.contentView.removeChildView(viewManager.views.get(viewManager.activeViewId)); } catch(e) {}
    } else if (viewManager.activeViewId) {
      viewManager.selectView(viewManager.activeViewId);
    }
  });

  ipcMain.handle('tab:getSuggestions', async (event, query) => {
    if (!query) return [];
    try {
      const response = await fetch(`https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data?.[1]) ? data[1] : [];
    } catch (error) {
      console.error('[Orbit Engine] Suggestions fetch failed:', error.message);
      return [];
    }
  });

  ipcMain.handle('tab:zoomIn', (event, { id }) => {
    const wc = viewManager.views.get(id)?.webContents;
    if (wc) wc.setZoomLevel(wc.getZoomLevel() + 0.5);
  });

  ipcMain.handle('tab:zoomOut', (event, { id }) => {
    const wc = viewManager.views.get(id)?.webContents;
    if (wc) wc.setZoomLevel(wc.getZoomLevel() - 0.5);
  });

  ipcMain.handle('tab:resetZoom', (event, { id }) => {
    const wc = viewManager.views.get(id)?.webContents;
    if (wc) wc.setZoomLevel(0);
  });

  ipcMain.handle('tab:getPageText', async (event, { id }) => {
    const view = viewManager.views.get(id);
    if (!view) return '';
    try {
      return await view.webContents.executeJavaScript(`
        (function() {
          const clone = document.body.cloneNode(true);
          clone.querySelectorAll('script, style, nav, footer, header, noscript, iframe').forEach(el => el.remove());
          return (clone.innerText || clone.textContent).replace(/\\s+/g, ' ').trim().substring(0, 15000);
        })()
      `);
    } catch (e) {
      console.error('[Orbit AI] Failed to get page text:', e);
      return '';
    }
  });

  ipcMain.on('ui:toggle-sidekick', (event, isOpen) => {
    if (viewManager) {
      viewManager.sidekickIsOpen = isOpen;
      if (!isOpen) viewManager.updateLayout(0);
    }
  });

  ipcMain.on('ui:sidekick-resize', (event, width) => {
    if (viewManager) viewManager.updateLayout(width);
  });

  // No longer needed — ui:dropdown-toggle is obsolete now that the React UI
  // is a WebContentsView rendered above all page views at the OS level.
  // Keeping a stub so existing frontend calls don't cause IPC errors.
  ipcMain.on('ui:dropdown-toggle', () => {});

  // Resize the uiView to only cover the header (92px) when browsing a website.
  // This is the ONLY working solution on Windows — setIgnoreMouseEvents(true) on
  // BaseWindow passes clicks to the OS desktop/taskbar causing minimize.
  // The page WebContentsView sits at y:92 and is directly reachable when uiView
  // doesn't cover it. Expand back to full height for New Tab / Settings / Overview.
  ipcMain.on('ui:set-ignore-mouse', (event, shouldPassThrough) => {
    if (!uiView || !mainWindow) return;
    const [width, height] = mainWindow.getContentSize();
    if (shouldPassThrough) {
      // Browsing: shrink to header only — page is directly clickable below
      uiView.setBounds({ x: 0, y: 0, width, height: 92 });
    } else {
      // Orbit UI panel open: expand to full window
      uiView.setBounds({ x: 0, y: 0, width, height });
    }
  });

  // Window Control Handlers
  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.on('window-close', () => mainWindow?.close());

  // Download Management
  const downloads = new Map();

  const setupDownloadHandler = (ses) => {
    ses.on('will-download', (event, item) => {
      const id = Date.now().toString();
      const filename = item.getFilename();
      const totalBytes = item.getTotalBytes();
      const savePath = item.getSavePath() || path.join(app.getPath('downloads'), filename);

      if (!item.getSavePath()) item.setSavePath(savePath);

      const downloadInfo = {
        id, filename, totalBytes,
        receivedBytes: 0, percentage: 0,
        state: 'progressing', path: savePath,
        startTime: Date.now()
      };

      downloads.set(id, downloadInfo);
      uiView.webContents.send('download:started', downloadInfo);

      item.on('updated', (event, state) => {
        if (state === 'interrupted') {
          downloadInfo.state = 'interrupted';
        } else if (state === 'progressing') {
          downloadInfo.receivedBytes = item.getReceivedBytes();
          downloadInfo.percentage = totalBytes > 0 ? Math.floor((downloadInfo.receivedBytes / totalBytes) * 100) : 0;
          downloadInfo.state = 'progressing';
        }
        uiView.webContents.send('download:updated', downloadInfo);
      });

      item.once('done', (event, state) => {
        downloadInfo.state = state === 'completed' ? 'completed' : 'failed';
        if (state === 'completed') downloadInfo.percentage = 100;
        uiView.webContents.send('download:updated', downloadInfo);
      });
    });
  };

  setupDownloadHandler(nativeTheme.session || session.defaultSession);
  app.on('session-created', (ses) => setupDownloadHandler(ses));

  ipcMain.handle('downloads:list', () => Array.from(downloads.values()).reverse());

  ipcMain.on('downloads:openFile', (event, id) => {
    const item = downloads.get(id);
    if (item && item.state === 'completed') shell.openPath(item.path);
  });

  ipcMain.on('downloads:showInFolder', (event, id) => {
    const item = downloads.get(id);
    if (item) shell.showItemInFolder(item.path);
  });

  ipcMain.on('downloads:remove', (event, id) => {
    downloads.delete(id);
    uiView.webContents.send('downloads:list-updated', Array.from(downloads.values()).reverse());
  });
}

app.whenReady().then(() => {
  createWindow();
  setupApplicationMenu();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
