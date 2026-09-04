import { contextBridge, ipcRenderer } from 'electron';

export interface Banner {
  en: string;
  zh: string;
}

contextBridge.exposeInMainWorld('winux', {
  onBanner: (cb: (banner: Banner) => void): void => {
    ipcRenderer.on('banner', (_evt, banner: Banner) => cb(banner));
  },
});
