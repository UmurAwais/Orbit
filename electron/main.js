import { app, BrowserWindow, ipcMain, Menu, MenuItem, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { ViewManager } from './ViewManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let viewManager;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#ffffff00',
      symbolColor: '#333333',
      height: 40
    },
    icon: path.join(__dirname, '../assets/orbit.png'),
    backgroundColor: '#ffffff',
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
    if (process.env.VITE_DEV_SERVER_URL) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    if (viewManager) viewManager.updateLayout();
  });

  setupIpcHandlers();
  setupGlobalContextMenus();
}

function setupGlobalContextMenus() {
  const createMenu = (webContents, params) => {
    const menu = new Menu();

    // Custom Identity
    menu.append(new MenuItem({
      label: '🚀 Send to Orbit Workspace',
      click: () => console.log('Workspace feature coming soon...')
    }));
    menu.append(new MenuItem({ type: 'separator' }));

    // Navigation
    menu.append(new MenuItem({ 
      label: 'Back', 
      enabled: webContents.navigationHistory?.canGoBack() ?? false, 
      click: () => webContents.navigationHistory.goBack(),
      accelerator: 'Alt+Left'
    }));
    menu.append(new MenuItem({ 
      label: 'Forward', 
      enabled: webContents.navigationHistory?.canGoForward() ?? false, 
      click: () => webContents.navigationHistory.goForward(),
      accelerator: 'Alt+Right'
    }));
    menu.append(new MenuItem({ 
      label: 'Reload', 
      click: () => webContents.reload(),
      accelerator: 'CmdOrCtrl+R'
    }));
    
    menu.append(new MenuItem({ type: 'separator' }));

    // Link/Image specific context
    if (params.linkURL) {
      menu.append(new MenuItem({
        label: 'Open Link in New Orbit Window',
        click: () => {
          const newWin = new BrowserWindow({ width: 1400, height: 900 });
          newWin.loadURL(params.linkURL);
        }
      }));
      menu.append(new MenuItem({
        label: 'Copy Link Address',
        role: 'copyLink'
      }));
    }

    if (params.hasImageContents) {
      menu.append(new MenuItem({
        label: 'Copy Image',
        click: () => webContents.copyImageAt(params.x, params.y)
      }));
    }

    // Inspect
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({
      label: 'Inspect Element',
      click: () => webContents.inspectElement(params.x, params.y)
    }));

    return menu;
  };

  app.on('web-contents-created', (e, webContents) => {
    webContents.on('context-menu', (event, params) => {
      event.preventDefault();
      const menu = createMenu(webContents, params);
      menu.popup();
    });
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
      const state = viewManager.tabStates.get(id);
      if (state) {
        console.log('[main.js] Setting lastUrl:', url);
        state.lastUrl = url;
      }

      console.log('[main.js] Loading URL in webContents');
      view.webContents.loadURL(url);
      
      if (viewManager.activeViewId === id && url !== 'about:blank') {
        console.log('[main.js] Attaching view and updating layout');
        try { mainWindow.contentView.addChildView(view); } catch(e) {}
        viewManager.updateLayout();
      }
    } else {
      console.error('[main.js] View not found for id:', id);
    }
  });

  ipcMain.handle('tab:reload', (event, { id }) => viewManager.views.get(id)?.webContents.reload());
  ipcMain.handle('tab:stop', (event, { id }) => {
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
          canGoBack: view.webContents.navigationHistory?.canGoBack() ?? false,
          canGoForward: view.webContents.navigationHistory?.canGoForward() ?? false,
        });
      }
    }
  });
  ipcMain.handle('tab:goBack', (event, { id }) => viewManager.views.get(id)?.webContents.navigationHistory.goBack());
  ipcMain.handle('tab:goForward', (event, { id }) => viewManager.views.get(id)?.webContents.navigationHistory.goForward());
  
  ipcMain.on('ui:toggle-overview', (event, isOverview) => {
    if (isOverview && viewManager.activeViewId) {
      try { mainWindow.contentView.removeChildView(viewManager.views.get(viewManager.activeViewId)); } catch(e) {}
    } else if (viewManager.activeViewId) {
      viewManager.selectView(viewManager.activeViewId);
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  setupApplicationMenu();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

