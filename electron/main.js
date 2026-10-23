const { app, BrowserWindow, ipcMain, session, systemPreferences } = require('electron');
const path = require('path');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Tell React whenever full screen changes (including the user leaving it)
  win.on('enter-full-screen', () => win.webContents.send('fullscreen-changed', true));
  win.on('leave-full-screen', () => win.webContents.send('fullscreen-changed', false));

  win.loadURL('http://localhost:5173');
}

// macOS shows its own camera/microphone prompt; other platforms rely on the page's getUserMedia
ipcMain.handle('request-media-access', async (_event, kind) => {
  if (kind !== 'camera' && kind !== 'microphone') return false;
  if (process.platform !== 'darwin') return true;
  return systemPreferences.askForMediaAccess(kind);
});

// Returns true if already full screen; otherwise 'enter-full-screen' fires once it is
ipcMain.handle('enter-fullscreen', () => {
  if (win.isFullScreen()) return true;
  win.setFullScreen(true);
  return false;
});

app.whenReady().then(() => {
  // Grant the page only camera, microphone and full screen
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'media' || permission === 'fullscreen');
  });
  createWindow();
});

app.on('window-all-closed', () => app.quit());
