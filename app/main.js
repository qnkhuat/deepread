const {app, BrowserWindow} = require('electron');
const path = require('path');
const {spawn} = require('child_process');
const fs = require('fs');
const portscanner = require('portscanner');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let backendProcess;
let backendPort = 8345; // Default port, will be dynamically assigned if busy

const logToFile = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  fs.appendFileSync('/Users/earther/tmp/log.txt', logMessage);
};

// Function to find an available port
async function findAvailablePort(startPort, endPort) {
  try {
    const port = await portscanner.findAPortNotInUse(startPort, endPort, '127.0.0.1');
    console.log(`Found available port: ${port}`);
    return port;
  } catch (error) {
    console.error(`Error finding available port: ${error}`);
    return startPort; // Fallback to start port if something goes wrong
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForBackend(maxAttempts = 30) {
  console.log('Waiting for backend to become available...');
  for (let i = 0; i < maxAttempts; i++) {

    try {
      console.log(`Attempt ${i + 1}/${maxAttempts} to connect to backend at port ${backendPort}...`);
      const response = await fetch(`http://localhost:${backendPort}`);
      if (response.ok) {
        console.log('Backend is up and running!');
        return;
      } else {
        console.error(`Backend responded with status ${response.status}`);
        await sleep(1000);
      }
    } catch (error) {
      console.error(`Backend connection error: ${error}`);
      await sleep(1000);
    }

  }
  console.error('Backend failed to start within 30 seconds');
  if (backendProcess) backendProcess.kill();
  app.quit();
}

async function startBackend() {
  // Find an available port first
  if (app.isPackaged) {
    backendPort = await findAvailablePort(8345, 8999);
    console.log(`Using port ${backendPort} for backend`);

    console.log('Starting Python backend in production mode...');

    // Path to the Python executable in the resources directory
    let backendExePath;
    if (process.platform === 'darwin') {
      // macOS
      backendExePath = path.join(process.resourcesPath, 'backend', 'backend');
    } else if (process.platform === 'win32') {
      // Windows
      backendExePath = path.join(process.resourcesPath, 'backend', 'backend.exe');
    } else {
      // Linux or other platforms
      backendExePath = path.join(process.resourcesPath, 'backend', 'backend');
    }
    console.log("BACKEND PATH: ", backendExePath);

    // Make sure the executable has proper permissions on macOS/Linux
    if (process.platform !== 'win32') {
      try {
        fs.chmodSync(backendExePath, '755');
        console.log('Set executable permissions for backend');
      } catch (error) {
        console.error('Failed to set executable permissions: ' + error);
      }
    }

    try {
      // Spawn the Python executable with the port as an environment variable
      backendProcess = spawn(backendExePath, [], {
        stdio: 'inherit',
        env: {
          ...process.env,
          PORT: backendPort.toString()
        }
      });
      console.log('Backend process spawned with PID: ' + backendProcess.pid);
    } catch (error) {
      console.error('Failed to spawn backend process: ' + error);
      app.quit();
      return;
    }

    backendProcess.on('error', (error) => {
      console.error('Backend process error: ' + error);
      app.quit();
    });

    backendProcess.on('exit', (code, signal) => {
      console.log(`Backend process exited with code ${code}, signal: ${signal}`);
      if (code !== 0) {
        console.error(`Backend process failed with code ${code}, signal: ${signal}`);
        app.quit();
      }
    });
  } else {
    // In development mode, the backend is started via npm script
    console.log('In development mode, backend should be started via npm script');
  }

  waitForBackend().catch(err => {
    console.error('Backend startup error: ' + err);
    if (backendProcess) backendProcess.kill();
    app.quit();
  });
}

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
    console.log(`Sent backend port ${backendPort} to frontend`);
  });
}

app.whenReady().then(async () => {
  await startBackend();
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    if (backendProcess) {
      console.log('Killing backend process');
      backendProcess.kill();
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    console.log('Killing backend process before quit');
    backendProcess.kill();
  }
});
