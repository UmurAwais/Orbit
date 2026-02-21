const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('orbit', {
  tabs: {
    create: (data) => ipcRenderer.invoke('tab:create', data),
    select: (data) => ipcRenderer.invoke('tab:select', data),
    navigate: (data) => ipcRenderer.invoke('tab:navigate', data),
    close: (data) => ipcRenderer.invoke('tab:close', data),
    reload: (data) => ipcRenderer.invoke('tab:reload', data),
    stop: (data) => ipcRenderer.invoke('tab:stop', data),
    goBack: (data) => ipcRenderer.invoke('tab:goBack', data),
    goForward: (data) => ipcRenderer.invoke('tab:goForward', data),
    zoomIn: (data) => ipcRenderer.invoke('tab:zoomIn', data),
    zoomOut: (data) => ipcRenderer.invoke('tab:zoomOut', data),
    resetZoom: (data) => ipcRenderer.invoke('tab:resetZoom', data),
    getZoom: (data) => ipcRenderer.invoke('tab:getZoom', data),
    onUpdate: (callback) => {
      const subscription = (event, data) => callback(data);
      ipcRenderer.on('tab:update', subscription);
      return () => ipcRenderer.removeListener('tab:update', subscription);
    },
  },
  ipcRenderer: {
    invoke: (channel, data) => ipcRenderer.invoke(channel, data),
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => {
      const subscription = (event, ...args) => func(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    },
  },
  downloads: {
    list: () => ipcRenderer.invoke('downloads:list'),
    openFile: (id) => ipcRenderer.send('downloads:openFile', id),
    showInFolder: (id) => ipcRenderer.send('downloads:showInFolder', id),
    remove: (id) => ipcRenderer.send('downloads:remove', id),
    onStarted: (callback) => {
      const sub = (event, data) => callback(data);
      ipcRenderer.on('download:started', sub);
      return () => ipcRenderer.removeListener('download:started', sub);
    },
    onUpdated: (callback) => {
      const sub = (event, data) => callback(data);
      ipcRenderer.on('download:updated', sub);
      return () => ipcRenderer.removeListener('download:updated', sub);
    },
    onListUpdated: (callback) => {
      const sub = (event, data) => callback(data);
      ipcRenderer.on('downloads:list-updated', sub);
      return () => ipcRenderer.removeListener('downloads:list-updated', sub);
    }
  }
});
