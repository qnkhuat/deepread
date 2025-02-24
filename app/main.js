const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // In development, load from React dev server
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }
}

function startBackend() {
  if (app.isPackaged) {
    const backendPath = path.join(__dirname, '../backend/main.js');
    backendProcess = spawn('node', [backendPath], {
      stdio: 'inherit'
    });
  } else {
    // Wait for backend to start
    const waitForBackend = async () => {
      const maxAttempts = 30;  // 30 seconds timeout
      for (let i = 0; i < maxAttempts; i++) {
        try {
          const response = await fetch('http://localhost:8000');
          if (response.ok) return;
        } catch (err) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      throw new Error('Backend failed to start within 30 seconds');
    };
    
    waitForBackend().catch(err => {
      console.error('Backend startup error:', err);
      app.quit();
    });
  }

  backendProcess.on('error', (error) => {
    console.error('Failed to start backend process:', error);
  });
}

app.whenReady().then(() => {
  createWindow();
  startBackend();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    if (backendProcess) {
      backendProcess.kill();
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
}); 
