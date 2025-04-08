const electron = window.require('electron');
const isDev = require('electron-is-dev');

export const ipcRenderer = electron.ipcRenderer;
export const electronIsDev = isDev;