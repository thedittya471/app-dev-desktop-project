const { contextBridge, ipcRenderer } = require('electron');

// The only main-process features the React app can use
contextBridge.exposeInMainWorld('api', {
  requestMediaAccess: (kind) => ipcRenderer.invoke('request-media-access', kind), // 'camera' | 'microphone' | 'screen'
  captureScreens: () => ipcRenderer.invoke('capture-screens'), // JPEG data URLs, one per display
  enterFullscreen: () => ipcRenderer.invoke('enter-fullscreen'),
  quit: () => ipcRenderer.invoke('quit'),
  onFullscreenChange: (callback) => {
    const listener = (_event, isFullscreen) => callback(isFullscreen);
    ipcRenderer.on('fullscreen-changed', listener);
    return () => ipcRenderer.removeListener('fullscreen-changed', listener);
  },
});
