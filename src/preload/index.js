const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('screengrabby', {
  chooseOutputDir: () => ipcRenderer.invoke('choose-output-dir'),
  openOutputFolder: (folderPath) => ipcRenderer.invoke('open-output-folder', folderPath),
  revealFile: (filePath) => ipcRenderer.invoke('reveal-file', filePath),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  capture: (payload) => ipcRenderer.invoke('capture-request', payload),
  captureBatch: (payload) => ipcRenderer.invoke('capture-batch-request', payload),
  onBatchProgress: (handler) => {
    ipcRenderer.on('capture-batch-progress', (_event, data) => handler(data));
  },
  onUpdateStatus: (handler) => {
    ipcRenderer.on('app-update-status', (_event, data) => handler(data));
  },
  getPreferences: () => ipcRenderer.invoke('preferences-get'),
  savePreferences: (payload) => ipcRenderer.invoke('preferences-save', payload)
});
