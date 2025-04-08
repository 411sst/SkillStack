const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const isDev = process.env.NODE_ENV !== 'production';

// Initialize store for app settings
const store = new Store();

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // Security: Keep this false
      contextIsolation: true, // Security: Keep this true
      enableRemoteModule: false, // Security: Keep this false
      preload: path.join(__dirname, 'preload.js'), // Use preload script
    },
  });

  // Load the React app
  if (isDev) {
    // In development, load from development server
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built app
    mainWindow.loadFile(path.join(__dirname, './build/index.html'));
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for file operations
ipcMain.handle('open-file-dialog', async (event, options) => {
  const { filePaths } = await dialog.showOpenDialog(options);
  return filePaths;
});

ipcMain.handle('save-file-dialog', async (event, options) => {
  const { filePath } = await dialog.showSaveDialog(options);
  return filePath;
});

ipcMain.handle('read-file', async (event, filePath) => {
  return fs.readFileSync(filePath);
});

ipcMain.handle('write-file', async (event, filePath, data) => {
  try {
    // Convert data to Buffer if it's an ArrayBuffer
    const buffer = Buffer.from(data);
    fs.writeFileSync(filePath, buffer);
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    throw error;
  }
});