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
    onUpdate: (callback) => {
      const subscription = (event, data) => callback(data);
      ipcRenderer.on('tab:update', subscription);
      return () => ipcRenderer.removeListener('tab:update', subscription);
    },
  },
  ipcRenderer: {
    invoke: (channel, data) => ipcRenderer.invoke(channel, data),
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  },
});
