import { app, BrowserWindow, ipcMain, Menu, MenuItem, shell, nativeTheme, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { ViewManager } from './ViewManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let viewManager;

function createWindow() {
  // Force light theme by default for the entire application and system preferences
  // nativeTheme.themeSource = 'light'; // Removed to allow dynamic theme switching

  mainWindow = new BrowserWindow({
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
    show: false, // Prevent flash
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
  });

  viewManager = new ViewManager(mainWindow);

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('resize', () => {
    viewManager.updateLayout();
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // if (process.env.VITE_DEV_SERVER_URL) {
    //   mainWindow.webContents.openDevTools({ mode: 'detach' });
    // }
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
          click: () => mainWindow.webContents.toggleDevTools()
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
      // Set target URL synchronously to prevent race condition in layout logic
      // Smart URL / Search Parsing (Chromium Behavior)
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
      if (state) {
        console.log('[main.js] Setting lastUrl:', targetUrl);
        state.lastUrl = targetUrl;
      }

      console.log('[main.js] Loading URL in webContents:', targetUrl);
      view.webContents.loadURL(targetUrl);
      
      if (viewManager.activeViewId === id && url !== 'about:blank') {
        viewManager.updateLayout();
      }
    } else {
      console.error('[main.js] View not found for id:', id);
    }
  });

  ipcMain.handle('tab:reload', (event, { id }) => {
    console.log(`[IPC] tab:reload requested for ${id}`);
    return viewManager.views.get(id)?.webContents.reload();
  });
  
  ipcMain.handle('tab:stop', (event, { id }) => {
    console.log(`[IPC] tab:stop requested for ${id}`);
    const view = viewManager.views.get(id);
    if (view) {
      view.webContents.stop();
      // Explicitly clear loading state
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
    console.log(`[IPC] tab:goBack requested for ${id}`);
    const wc = viewManager.views.get(id)?.webContents;
    if (wc) {
      if (wc.navigationHistory) wc.navigationHistory.goBack();
      else if (wc.canGoBack()) wc.goBack();
    }
  });
  
  ipcMain.handle('tab:goForward', (event, { id }) => {
    console.log(`[IPC] tab:goForward requested for ${id}`);
    const wc = viewManager.views.get(id)?.webContents;
    if (wc) {
      if (wc.navigationHistory) wc.navigationHistory.goForward();
      else if (wc.canGoForward()) wc.goForward();
    }
  });
  
   ipcMain.on('ui:toggle-overview', (event, isOverview) => {
    viewManager.isOverview = isOverview;
    if (isOverview && viewManager.activeViewId) {
      // Capture before hiding
      viewManager.captureThumbnail(viewManager.activeViewId);
      try { mainWindow.contentView.removeChildView(viewManager.views.get(viewManager.activeViewId)); } catch(e) {}
    } else if (viewManager.activeViewId) {
      viewManager.selectView(viewManager.activeViewId);
    }
  });

  ipcMain.handle('tab:getSuggestions', async (event, query) => {
    if (!query) return [];
    try {
      // Use a proper User-Agent to avoid being blocked or getting 405/403
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
    if (wc) {
      const currentZoom = wc.getZoomLevel();
      wc.setZoomLevel(currentZoom + 0.5);
    }
  });

  ipcMain.handle('tab:zoomOut', (event, { id }) => {
    const wc = viewManager.views.get(id)?.webContents;
    if (wc) {
      const currentZoom = wc.getZoomLevel();
      wc.setZoomLevel(currentZoom - 0.5);
    }
  });

  ipcMain.handle('tab:resetZoom', (event, { id }) => {
    const wc = viewManager.views.get(id)?.webContents;
    if (wc) {
      wc.setZoomLevel(0);
    }
  });

  ipcMain.handle('tab:getPageText', async (event, { id }) => {
    const view = viewManager.views.get(id);
    if (!view) return '';
    try {
      return await view.webContents.executeJavaScript(`
        (function() {
          // Remove scripts, styles, and other non-content tags
          const clone = document.body.cloneNode(true);
          const toRemove = clone.querySelectorAll('script, style, nav, footer, header, noscript, iframe');
          toRemove.forEach(el => el.remove());
          
          // Get clean text
          let text = clone.innerText || clone.textContent;
          // Basic cleanup of whitespace
          return text.replace(/\\s+/g, ' ').trim().substring(0, 15000);
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
      // Force immediate expansion on close to prevent white flashes
      // The contracting sidebar UI will 'reveal' the already-expanded page
      if (!isOpen) viewManager.updateLayout(0);
    }
  });

  ipcMain.on('ui:sidekick-resize', (event, width) => {
    if (viewManager) {
      viewManager.updateLayout(width);
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
    ses.on('will-download', (event, item, webContents) => {
      const id = Date.now().toString();
      const filename = item.getFilename();
      const totalBytes = item.getTotalBytes();
      const savePath = item.getSavePath() || path.join(app.getPath('downloads'), filename);
      
      // Default behavior: save to downloads folder
      if (!item.getSavePath()) item.setSavePath(savePath);

      const downloadInfo = {
        id,
        filename,
        totalBytes,
        receivedBytes: 0,
        percentage: 0,
        state: 'progressing',
        path: savePath,
        startTime: Date.now()
      };

      downloads.set(id, downloadInfo);
      mainWindow.webContents.send('download:started', downloadInfo);

      item.on('updated', (event, state) => {
        if (state === 'interrupted') {
          downloadInfo.state = 'interrupted';
        } else if (state === 'progressing') {
          downloadInfo.receivedBytes = item.getReceivedBytes();
          downloadInfo.percentage = totalBytes > 0 ? Math.floor((downloadInfo.receivedBytes / totalBytes) * 100) : 0;
          downloadInfo.state = 'progressing';
        }
        mainWindow.webContents.send('download:updated', downloadInfo);
      });

      item.once('done', (event, state) => {
        if (state === 'completed') {
          downloadInfo.state = 'completed';
          downloadInfo.percentage = 100;
        } else {
          downloadInfo.state = 'failed';
        }
        mainWindow.webContents.send('download:updated', downloadInfo);
      });
    });
  };

  // Attach to default session and any future sessions
  setupDownloadHandler(nativeTheme.session || session.defaultSession);
  app.on('session-created', (ses) => setupDownloadHandler(ses));

  ipcMain.handle('downloads:list', () => Array.from(downloads.values()).reverse());
  
  ipcMain.on('downloads:openFile', (event, id) => {
    const item = downloads.get(id);
    if (item && item.state === 'completed') {
      shell.openPath(item.path);
    }
  });

  ipcMain.on('downloads:showInFolder', (event, id) => {
    const item = downloads.get(id);
    if (item) {
      shell.showItemInFolder(item.path);
    }
  });

  ipcMain.on('downloads:remove', (event, id) => {
    downloads.delete(id);
    mainWindow.webContents.send('downloads:list-updated', Array.from(downloads.values()).reverse());
  });
}

app.whenReady().then(() => {
  createWindow();
  setupApplicationMenu();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

