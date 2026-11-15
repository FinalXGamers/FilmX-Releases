'use strict';

const { app, BrowserWindow, shell } = require('electron');

const FILMX_ORIGIN = 'https://filmx.is-best.net';

function openExternal(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') shell.openExternal(parsed.href);
  } catch (error) {
    console.error('Blocked invalid external URL:', error);
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 900,
    minHeight: 640,
    show: false,
    autoHideMenuBar: process.platform !== 'darwin',
    backgroundColor: '#080a0f',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.once('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.setUserAgent(
    window.webContents.getUserAgent() + ' FilmXDesktop/' + app.getVersion() + ' FilmXPlatform/' + process.platform
  );
  window.webContents.on('will-navigate', (event, url) => {
    if (new URL(url).origin !== FILMX_ORIGIN) {
      event.preventDefault();
      openExternal(url);
    }
  });
  window.loadURL(FILMX_ORIGIN);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
