const { contextBridge, ipcRenderer } = require('electron');

// Expose the backend port to the renderer process
contextBridge.exposeInMainWorld('electron', {
  backendPort: null, // Will be set by the main process
});

// Listen for the backend-port message from the main process
ipcRenderer.on('backend-port', (event, port) => {
  window.electron.backendPort = port;
}); 
