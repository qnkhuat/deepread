const {app, BrowserWindow} = require('electron');
const path = require('path');
const {spawn} = require('child_process');
const fs = require('fs');
const portscanner = require('portscanner');
const logFilePath = '/Users/earther/tmp/log.txt';

let mainWindow;
let backendProcess;
let backendPort = 8000; // Default port, will be dynamically assigned if busy

// Function to find an available port
async function findAvailablePort(startPort, endPort) {
  try {
    const port = await portscanner.findAPortNotInUse(startPort, endPort, '127.0.0.1');
    logToFile(`Found available port: ${port}`);
    return port;
  } catch (error) {
    logToFile(`Error finding available port: ${error}`);
    return startPort; // Fallback to start port if something goes wrong
  }
}

function logToFile(message) {
  fs.appendFileSync(logFilePath, message + '\n');
}

function logAllFilesInDir() {
  try {
    const files = fs.readdirSync(__dirname);
    logToFile('Files in __dirname:');
    files.forEach(file => {
      logToFile(`File: ${file}, Path: ${path.join(__dirname, file)}`);
    });
  } catch (error) {
    logToFile('Error reading directory: ' + error);
  }
}

// Call the function to log all files

function createWindow() {
  // Use platform-specific icons
  let iconPath;
  if (process.platform === 'darwin') {
    iconPath = path.resolve(__dirname, '../frontend/public/icon/macos/icon.icns');
  } else if (process.platform === 'win32') {
    iconPath = path.resolve(__dirname, '../frontend/public/icon/win/icon.ico');
  } else {
    // Linux or other platforms
    iconPath = path.resolve(__dirname, '../frontend/public/icon/png/1024x1024.png');
  }
  logToFile('Icon path: ' + iconPath);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // In development, load from React dev server
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }

  // Send the backend port to the frontend
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('backend-port', backendPort);
    logToFile(`Sent backend port ${backendPort} to frontend`);
  });
}

async function startBackend() {
  // Find an available port first
  backendPort = await findAvailablePort(8345, 8999);
  logToFile(`Using port ${backendPort} for backend`);

  if (app.isPackaged) {
    logToFile('Starting backend in production mode...');

    const backendPath = path.join(process.resourcesPath, 'backend', 'main.js');
    logToFile('Backend path: ' + backendPath);

    // Verify backend file exists
    if (!require('fs').existsSync(backendPath)) {
      logToFile('Backend file not found: ' + backendPath);
      app.quit();
      return;
    }
    logToFile('Backend file found, attempting to start process...');

    // Create node_modules directory if it doesn't exist
    const backendDir = path.dirname(backendPath);

    try {
      backendProcess = spawn('node', [backendPath], {
        stdio: 'inherit',
        cwd: backendDir,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PORT: backendPort.toString() // Pass the port to the backend
        }
      });
      logToFile('Backend process spawned with PID: ' + backendProcess.pid);
    } catch (error) {
      logToFile('Failed to spawn backend process: ' + error);
      app.quit();
      return;
    }

    backendProcess.on('error', (error) => {
      logToFile('Backend process error: ' + error);
      app.quit();
    });

    backendProcess.on('exit', (code, signal) => {
      logToFile(`Backend process exited with code ${code}, signal: ${signal}`);
      if (code !== 0) {
        logToFile(`Backend process failed with code ${code}, signal: ${signal}`);
        app.quit();
      }
    });

    // Verify backend is running by checking the endpoint
    const waitForBackend = async () => {
      logToFile('Waiting for backend to become available...');
      const maxAttempts = 30;  // 30 seconds timeout
      for (let i = 0; i < maxAttempts; i++) {
        try {
          logToFile(`Attempt ${i + 1}/${maxAttempts} to connect to backend...`);
          const response = await fetch(`http://localhost:${backendPort}`);
          if (response.ok) {
            logToFile('Backend is up and running!');
            return;
          }
        } catch (err) {
          logToFile(`Backend not ready, retrying in 1s... (${err.message})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      logToFile('Backend failed to start within 30 seconds');
      if (backendProcess) backendProcess.kill();
      app.quit();
    };

    waitForBackend().catch(err => {
      logToFile('Backend startup error: ' + err);
      if (backendProcess) backendProcess.kill();
      app.quit();
    });
  } else {
    // In development mode, we need to pass the port to the backend
    // This assumes the backend is started separately in development

    // Wait for backend to start
    const waitForBackend = async () => {
      const maxAttempts = 30;  // 30 seconds timeout
      for (let i = 0; i < maxAttempts; i++) {
        try {
          const response = await fetch(`http://localhost:${backendPort}`);
          if (response.ok) return;
        } catch (err) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      throw new Error('Backend failed to start within 30 seconds');
    };

    waitForBackend().catch(err => {
      logToFile('Backend startup error: ' + err);
      app.quit();
    });
  }
}

app.whenReady().then(async () => {
  await startBackend();
  createWindow();

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
