const { app, BrowserWindow, desktopCapturer, ipcMain, screen, session, systemPreferences } = require('electron');
const path = require('path');

let win;
let testLocked = false; // true from "Go to test" until the Quit button

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
  // Cmd+W / the close button
  win.on('close', (event) => {
    if (testLocked) event.preventDefault();
  });

  // The .dmg app ships the built React app; `npm start` uses the Vite dev server
  if (app.isPackaged) win.loadFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  else win.loadURL('http://localhost:5173');
}

// macOS shows its own camera prompt; other platforms rely on the page's getUserMedia
ipcMain.handle('request-media-access', async (_event, kind) => {
  if (kind !== 'camera' && kind !== 'screen') return false;
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

// Kiosk mode keeps the window full screen and, on macOS, also blocks Cmd+Tab, Cmd+H and Force Quit.
// ponytail: a reload (Cmd+R) still restarts the page; remove the app menu if that matters
ipcMain.handle('lock-test', () => {
  testLocked = true;
  win.setKiosk(true);
});

// The Quit button on the result screen. app.exit, not app.quit: once a Cmd+Q has been
// blocked, macOS leaves the app mid-quit and a later app.quit() does nothing.
ipcMain.handle('quit', () => app.exit());

app.whenReady().then(() => {
  // Grant the page only the camera and full screen
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'media' || permission === 'fullscreen');
  });
  createWindow();
});

// Cmd+Q / Quit in the menu or Dock. Ctrl+C in the terminal is blocked too while locked;
// a developer stuck in a locked app can run: pkill -9 -f "Electron.app/Contents/MacOS/Electron"
app.on('before-quit', (event) => {
  if (testLocked) event.preventDefault();
});

app.on('window-all-closed', () => app.quit());
