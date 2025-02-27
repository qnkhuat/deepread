const { contextBridge, ipcRenderer } = require('electron');

// Create a variable to store the port
let backendPort = null;

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electron', {
  // Getter function that always returns the current value
  getBackendPort: () => backendPort,
  
  // You can also add a listener for when the port changes
  onBackendPortChange: (callback) => {
    ipcRenderer.on('backend-port', (_, port) => {
      callback(port);
    });
  }
});

// Listen for the backend-port message from the main process
ipcRenderer.on('backend-port', (_, port) => {
  console.log('Received backend port in preload:', port);
  backendPort = port; // Update the local variable
});
