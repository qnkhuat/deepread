const { contextBridge } = require('electron');

// Expose minimal API to the renderer process
contextBridge.exposeInMainWorld('electron', {
  // Add any electron-specific functionality here if needed
  // For example, you could add file system access or other native features
  platform: process.platform
});
