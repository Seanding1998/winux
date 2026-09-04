import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { execSync, spawn } from 'child_process';

// ============================================================================
// winux —— 替换 Windows 桌面壳的 GNOME 外观
// 安全前提：接管前记录 explorer 状态；app 退出(含异常)时自动恢复 explorer。
// ============================================================================

let explorerWasRunning = true;

function explorerRunning(): boolean {
  try {
    execSync('tasklist /FI "IMAGENAME eq explorer.exe"', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function killExplorer(): void {
  try {
    explorerWasRunning = explorerRunning();
    execSync('taskkill /f /im explorer.exe', { stdio: 'pipe' });
    // 拉起独立看门狗：即使 winux 被强杀，也能自动恢复 explorer
    // 优先从可执行文件旁找（打包版），否则回退到开发目录 scripts/
    const exeDir = path.dirname(process.execPath);
    const candidates = [
      path.join(exeDir, 'watchdog.cmd'),
      path.join(__dirname, '..', '..', 'scripts', 'watchdog.cmd'),
    ];
    const wd = candidates.find((c) => fs.existsSync(c));
    if (wd) {
      try {
        const wdProc = spawn('cmd.exe', ['/c', wd, String(process.pid)], {
          detached: true,
          stdio: 'ignore',
          windowsHide: true,
        });
        wdProc.unref();
      } catch (e) {
        console.error('watchdog launch failed:', e);
      }
    }
  } catch (e) {
    console.error('killExplorer failed:', e);
  }
}

function restoreExplorer(): void {
  try {
    execSync('start explorer.exe', { stdio: 'pipe', shell: 'cmd.exe' });
  } catch (e) {
    console.error('restoreExplorer failed:', e);
  }
}

// 渲染层请求打开"终端"（真 cmd.exe）
function openCmd(): void {
  // 用 spawn 以分离进程方式启动 cmd，不阻塞应用
  const cmd = spawn('cmd.exe', [], {
    detached: true,
    stdio: 'ignore',
    cwd: process.env.USERPROFILE,
  });
  cmd.unref();
}

// 渲染层请求打开真资源管理器窗口（XP 的"我的电脑"）
function openExplorer(): void {
  const ex = spawn('explorer.exe', [], {
    detached: true,
    stdio: 'ignore',
    cwd: process.env.USERPROFILE,
  });
  ex.unref();
}

function createWindow(): void {
  const isShot = process.env.WINUX_SHOT === '1';
  const isDryrun = process.env.WINUX_DRYRUN === '1';
  const skin = (() => {
    // 优先读打包目录下 settings.json（固化皮肤），否则环境变量，最后默认 gnome。
    try {
      const cfg = path.join(path.dirname(process.execPath), 'settings.json');
      if (fs.existsSync(cfg)) {
        const j = JSON.parse(fs.readFileSync(cfg, 'utf8'));
        if (j.skin === 'xp' || j.skin === 'gnome') return j.skin;
      }
    } catch {}
    return (process.env.WINUX_SKIN || 'gnome') as 'gnome' | 'xp';
  })();
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    // 截图验收模式用固定尺寸窗口（fullscreen 会干扰 capturePage 时序）
    fullscreen: !isShot && !isDryrun,
    backgroundColor: skin === 'xp' ? '#004082' : '#1e1e2e',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 按皮肤加载对应界面：gnome -> ui/index.html，xp -> ui/xp/index.html
  const uiDir = skin === 'xp' ? 'xp' : '.';
  win.loadFile(path.join(__dirname, 'ui', uiDir, 'index.html'));

  win.once('ready-to-show', () => {
    // WINUX_DRYRUN=1 时不杀 explorer（安全测试模式），否则真正接管
    if (process.env.WINUX_DRYRUN !== '1') killExplorer();
    win.show();
    if (skin === 'xp') {
      win.webContents.send('banner', { zh: 'Windows XP 已启动。这是 2026 年的 Windows 11。别慌。', en: 'Windows XP has started.' });
    } else {
      win.webContents.send('banner', { en: 'This is Windows. You are looking at Linux.', zh: '这是 Windows，你在看 Linux，别慌。' });
    }
  });

  // 自动恢复保护：接管后 12 秒内若窗口没能展现/加载失败，强制恢复 explorer，
  // 避免界面坏掉时桌面回不来。
  setTimeout(() => {
    if (!win.isDestroyed() && !win.isVisible()) {
      console.warn('winux 窗口未在 12s 内显示，自动恢复 Windows 桌面');
      restoreExplorer();
      try { app.quit(); } catch {}
    }
  }, 12000);

  // 拦截系统关闭，确保先恢复 explorer
  win.on('closed', () => restoreExplorer());
}

// 渲染层逻辑与主进程通信
ipcMain.handle('open-cmd', () => {
  openCmd();
});
ipcMain.handle('open-explorer', () => {
  openExplorer();
});
ipcMain.handle('restore-explorer', () => {
  restoreExplorer();
  app.quit();
});
ipcMain.handle('shutdown', () => {
  // 默认恢复桌面并退出（安全）。若设 WINUX_REAL_SHUTDOWN=1 则真关机（XP 草点）。
  restoreExplorer();
  if (process.env.WINUX_REAL_SHUTDOWN === '1') {
    execSync('shutdown /s /t 5', { stdio: 'ignore' });
  } else {
    app.quit();
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// 兜底：无论如何退出，都恢复 explorer，避免系统桌面回不来
app.on('will-quit', () => {
  restoreExplorer();
});
