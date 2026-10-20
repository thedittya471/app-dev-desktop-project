const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  win.loadURL('http://localhost:5173');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
