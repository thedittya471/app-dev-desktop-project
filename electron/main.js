const { app, BrowserWindow, desktopCapturer, ipcMain, screen, session, systemPreferences } = require('electron');
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
  if (kind !== 'camera' && kind !== 'microphone' && kind !== 'screen') return false;
  if (process.platform !== 'darwin') return true;
  if (kind !== 'screen') return systemPreferences.askForMediaAccess(kind);

  // macOS has no "ask" API for screen recording: trying to capture shows the prompt the
  // first time, and the user must enable it in System Settings and restart the app.
  if (systemPreferences.getMediaAccessStatus('screen') === 'granted') return true;
  // Throws "Failed to get sources" when access is denied; we only want the prompt side effect
  await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1, height: 1 } }).catch(() => {});
  return false;
});

// One JPEG data URL per connected display
ipcMain.handle('capture-screens', async () => {
  const displays = screen.getAllDisplays();
  const thumbnailSize = {
    width: Math.max(...displays.map((d) => d.size.width)),
    height: Math.max(...displays.map((d) => d.size.height)),
  };
  const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize });
  return sources
    .filter((source) => !source.thumbnail.isEmpty())
    .map((source) => `data:image/jpeg;base64,${source.thumbnail.toJPEG(70).toString('base64')}`);
});

// Returns true if already full screen; otherwise 'enter-full-screen' fires once it is
ipcMain.handle('enter-fullscreen', () => {
  if (win.isFullScreen()) return true;
  win.setFullScreen(true);
  return false;
});

// Called after the test is submitted
ipcMain.handle('quit', () => app.quit());

app.whenReady().then(() => {
  // Grant the page only camera, microphone and full screen
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'media' || permission === 'fullscreen');
  });
  createWindow();
});

app.on('window-all-closed', () => app.quit());
