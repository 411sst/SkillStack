const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options),
  saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
  copyFile: (source, destination) => ipcRenderer.invoke('copy-file', source, destination),
});

// Load the bridge only in production to avoid issues during development
try {
  const fileConverterBridge = require('./src/bridge/fileConverterBridge');
  
  // Expose file converter bridge
  contextBridge.exposeInMainWorld('fileConverter', {
    convertFile: (inputFile, outputFile, sourcePRONOM, targetPRONOM) => 
      fileConverterBridge.convertFile(inputFile, outputFile, sourcePRONOM, targetPRONOM)
  });
} catch (error) {
  console.error('Error loading file converter bridge:', error);
  
  // Provide a fallback for development
  contextBridge.exposeInMainWorld('fileConverter', {
    convertFile: () => Promise.reject(new Error('File converter not available in development mode'))
  });
}