const {app, BrowserWindow} = require('electron');
const path = require('path');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const logToFile = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  
  // Get platform-specific log directory
  let logPath;
  if (process.platform === 'darwin') {
    // macOS: ~/Library/Logs/[AppName]
    logPath = path.join(app.getPath('home'), 'Library', 'Logs', app.getName());
  } else if (process.platform === 'win32') {
    // Windows: %USERPROFILE%\AppData\Local\[AppName]\Logs
    logPath = path.join(app.getPath('userData'), 'Logs');
  } else {
    // Linux: ~/.config/[AppName]/logs
    logPath = path.join(app.getPath('userData'), 'logs');
  }
  
  // Ensure log directory exists
  if (!fs.existsSync(logPath)) {
    fs.mkdirSync(logPath, { recursive: true });
  }
  
  const logFile = path.join(logPath, 'app.log');
  fs.appendFileSync(logFile, logMessage);
};

function createWindow() {
  logToFile('Creating main window');
  
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
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Determine the location of the frontend files
  let frontendPath;
  
  // In development mode, load from the dev server
  if (!app.isPackaged) {
    frontendPath = 'http://localhost:5173';
    mainWindow.loadURL(frontendPath);
    // Open DevTools in development mode
    mainWindow.webContents.openDevTools();
  } else {
    // In production mode, load from the built files
    frontendPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
    
    if (fs.existsSync(frontendPath)) {
      mainWindow.loadFile(frontendPath);
    } else {
      // Fallback to looking in the app.asar directory
      frontendPath = path.join(process.resourcesPath, 'app.asar', 'frontend', 'dist', 'index.html');
      if (fs.existsSync(frontendPath)) {
        mainWindow.loadFile(frontendPath);
      } else {
        logToFile(`Error: Could not find frontend files at ${frontendPath}`);
        // Create a simple error HTML file
        const errorHtml = `
          <html>
            <body>
              <h1>Error: Could not find frontend files</h1>
              <p>The application could not find the required frontend files.</p>
            </body>
          </html>
        `;
        const errorPath = path.join(app.getPath('temp'), 'error.html');
        fs.writeFileSync(errorPath, errorHtml);
        mainWindow.loadFile(errorPath);
      }
    }
  }

  logToFile(`Loading frontend from: ${frontendPath}`);

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.on('ready', async () => {
  logToFile('App is ready');
  createWindow();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  logToFile('All windows closed');
  
  // On macOS, applications keep their menu bar active until the user quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create a window when the dock icon is clicked and no other windows are open
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle app quit
app.on('quit', () => {
  logToFile('App is quitting');
});
