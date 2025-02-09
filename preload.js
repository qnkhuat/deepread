const { contextBridge, ipcRenderer } = require('electron');

// Exposing the openFile method to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile')
}); 
