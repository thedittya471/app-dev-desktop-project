const { contextBridge, ipcRenderer } = require('electron');

// The only main-process features the React app can use
contextBridge.exposeInMainWorld('api', {
  requestMediaAccess: (kind) => ipcRenderer.invoke('request-media-access', kind), // 'camera' | 'microphone'
  enterFullscreen: () => ipcRenderer.invoke('enter-fullscreen'),
  onFullscreenChange: (callback) => {
    const listener = (_event, isFullscreen) => callback(isFullscreen);
    ipcRenderer.on('fullscreen-changed', listener);
    return () => ipcRenderer.removeListener('fullscreen-changed', listener);
  },
});
