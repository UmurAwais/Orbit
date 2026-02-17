import { Menu, MenuItem, shell } from 'electron';

export class ContextMenuManager {
  constructor(viewManager) {
    this.viewManager = viewManager;
  }

  register(webContents, id) {
    webContents.on('context-menu', (event, params) => {
      const menu = new Menu();

      // Link specific options
      if (params.linkURL) {
        menu.append(new MenuItem({
          label: 'Open in New Tab',
          click: () => this.viewManager.sendToUI('tab:open-request', { url: params.linkURL })
        }));
        menu.append(new MenuItem({
          label: 'Copy Link Address',
          click: () => {
            const { clipboard } = require('electron');
            clipboard.writeText(params.linkURL);
          }
        }));
        menu.append(new MenuItem({ type: 'separator' }));
      }

      // Image specific options
      if (params.hasImageContents) {
        menu.append(new MenuItem({
          label: 'Save Image As...',
          click: () => webContents.downloadURL(params.srcURL)
        }));
        menu.append(new MenuItem({
          label: 'Copy Image Address',
          click: () => {
            const { clipboard } = require('electron');
            clipboard.writeText(params.srcURL);
          }
        }));
        menu.append(new MenuItem({
          label: 'Search Image with Google',
          click: () => shell.openExternal(`https://www.google.com/searchbyimage?image_url=${encodeURIComponent(params.srcURL)}`)
        }));
        menu.append(new MenuItem({ type: 'separator' }));
      }

      // Standard Navigation
      menu.append(new MenuItem({
        label: 'Back',
        enabled: webContents.canGoBack(),
        click: () => webContents.goBack()
      }));
      menu.append(new MenuItem({
        label: 'Forward',
        enabled: webContents.canGoForward(),
        click: () => webContents.goForward()
      }));
      menu.append(new MenuItem({
        label: 'Reload',
        click: () => webContents.reload()
      }));
      menu.append(new MenuItem({ type: 'separator' }));

      menu.append(new MenuItem({
        label: 'Inspect Element',
        click: () => webContents.inspectElement(params.x, params.y)
      }));

      menu.popup();
    });
  }
}
