const {app, BrowserWindow} = require('electron');
const path = require('path');
const {spawn} = require('child_process');
const fs = require('fs');
const logFilePath = '/Users/earther/tmp/log.txt';

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
    const backendPath = path.join(process.resourcesPath, 'backend', 'main.js');
    // Verify backend file exists
    if (!require('fs').existsSync(backendPath)) {
      app.quit();
      return;
    }

    // Create node_modules directory if it doesn't exist
    const backendDir = path.dirname(backendPath);
    const nodeModulesPath = path.join(backendDir, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      require('child_process').execSync('npm install --production', {
        cwd: backendDir,
        stdio: 'inherit'
      });
    }

    try {
      backendProcess = spawn('node', [backendPath], {
        stdio: 'inherit',
        cwd: backendDir,
        env: {
          ...process.env,
          NODE_ENV: 'production'
        }
      });
    } catch (error) {
      app.quit();
      return;
    }

    backendProcess.on('error', (error) => {
      app.quit();
    });

    backendProcess.on('exit', (code, signal) => {
      if (code !== 0) {
        app.quit();
      }
    });

    // Verify backend is running by checking the endpoint
    const waitForBackend = async () => {
      const maxAttempts = 30;  // 30 seconds timeout
      for (let i = 0; i < maxAttempts; i++) {
        try {
          const response = await fetch('http://localhost:8000');
          if (response.ok) {
            return;
          }
        } catch (err) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      if (backendProcess) backendProcess.kill();
      app.quit();
    };

    waitForBackend().catch(err => {
      if (backendProcess) backendProcess.kill();
      app.quit();
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
      app.quit();
    });
  }
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
