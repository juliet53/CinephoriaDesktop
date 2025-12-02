const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const keytar = require('keytar');

const SERVICE = 'MonAppElectron';
const ACCOUNT = 'userToken';

// Handlers Keytar pour le stockage sécurisé du token
ipcMain.handle('save-token', async (event, token) => {
  await keytar.setPassword(SERVICE, ACCOUNT, token);
  return true;
});

ipcMain.handle('get-token', async () => {
  return await keytar.getPassword(SERVICE, ACCOUNT);
});

ipcMain.handle('delete-token', async () => {
  await keytar.deletePassword(SERVICE, ACCOUNT);
  return true;
});

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, 
      nodeIntegration: false  
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
