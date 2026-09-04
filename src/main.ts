import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// 本机是 Windows，我们假装建了一个 Linux 登录会话。
function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    backgroundColor: '#1e1e2e',
    show: false,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 主进程已编译到 dist/main.js，界面 HTML 位于同级 dist/ui/index.html
  win.loadFile(path.join(__dirname, 'ui', 'index.html'));

  win.once('ready-to-show', async () => {
    win.show();
    // 整活：开屏就弹个"这是 Windows"提示
    win.webContents.send('banner', {
      en: 'This is Windows. You are looking at Linux.',
      zh: '这是 Windows，你在看 Linux，别慌。',
    });

    // 自动截图钩子（仅当 WINUX_SHOT=1 时触发，用于无头视觉验收）
    if (process.env.WINUX_SHOT === '1') {
      // 多等一会儿让界面稳定
      setTimeout(async () => {
        try {
          // WINUX_SHOT_STATE 可指定要截取的状态：overview | power | app
          const state = process.env.WINUX_SHOT_STATE || '';
          if (state) {
            win.webContents.executeJavaScript(`window.__winuxDemo && window.__winuxDemo("${state}")`);
            await new Promise((r) => setTimeout(r, 400));
          }
          const img = await win.webContents.capturePage();
          // 写到进程可写目录（打包版 __dirname 在 asar 内不可写，用 cwd）
          const dir = path.join(process.cwd(), 'artifacts');
          fs.mkdirSync(dir, { recursive: true });
          const name = state ? `shot_${state}.png` : 'shot.png';
          fs.writeFileSync(path.join(dir, name), img.toPNG());
          console.log(`WINUX_SHOT saved -> artifacts/${name}`);
          app.quit();
        } catch (e) {
          console.error('screenshot failed', e);
          app.quit();
        }
      }, 1500);
    }
  });
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
