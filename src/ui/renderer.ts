// winux 渲染逻辑 —— 假装我们是 GNOME Shell。
// 注意：浏览器环境，无 Node API。所有 Electron 能力通过 window.winux 桥接。

// ---------- 类型 ----------
interface AppDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  run?: () => void;
}

interface Banner {
  en: string;
  zh: string;
}

// ---------- DOM 工具 ----------
function $(sel: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(sel);
  if (!el) throw new Error(`missing element: ${sel}`);
  return el;
}

// ---------- 时钟 ----------
function updateClock(): void {
  const now = new Date();
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const label = `${days[now.getDay()]} ${now.getMonth() + 1}月${now.getDate()}日 ${hh}:${mm}`;
  $('#clock').textContent = label;
}

// ---------- 桌面图标（假 GNOME 桌面）----------
const desktopIcons = [
  { label: '文件', icon: '🗂️' },
  { label: '主目录', icon: '🏠' },
  { label: '废纸篓', icon: '🗑️' },
];
function renderDesktopIcons(): void {
  const wrap = $('#desktop-icons');
  wrap.innerHTML = '';
  for (const item of desktopIcons) {
    const el = document.createElement('div');
    el.className = 'desktop-icon';
    el.innerHTML = `<span class="icon">${item.icon}</span><span class="label">${item.label}</span>`;
    wrap.appendChild(el);
  }
}

// ---------- 应用网格（Activities 总览里的应用）----------
const apps: AppDef[] = [
  { id: 'files', name: '文件', icon: '🗂️', color: '#5b8dee' },
  { id: 'term', name: '终端', icon: '⌨️', color: '#3a9d6e' },
  { id: 'firefox', name: 'Firefox', icon: '🦊', color: '#ff7a4d' },
  { id: 'nautilus', name: 'Nautilus', icon: '📁', color: '#58c58b' },
  { id: 'gimp', name: 'GIMP', icon: '🖌️', color: '#8a5bd6' },
  { id: 'vscode', name: 'VS Code', icon: '🧩', color: '#4aa8e6' },
  { id: 'cal', name: '日历', icon: '📅', color: '#e65b8a' },
  { id: 'music', name: '音乐', icon: '🎵', color: '#e6a34a' },
  { id: 'settings', name: '设置', icon: '⚙️', color: '#9aa0a6' },
];

function renderAppGrid(): void {
  const grid = $('#app-grid');
  grid.innerHTML = '';
  for (const app of apps) {
    const tile = document.createElement('button');
    tile.className = 'app-tile';
    tile.innerHTML = `
      <span class="app-icon" style="background:${app.color}">${app.icon}</span>
      <span class="app-name">${app.name}</span>`;
    tile.addEventListener('click', () => {
      closeOverview();
      if (app.run) app.run();
      else openMockWindow(`正在打开：${app.name}`, '这是一个假装运行的 Linux 应用。');
    });
    grid.appendChild(tile);
  }
}

// ---------- 活动总览 ----------
const overview = $('#overview');
const searchInput = document.querySelector<HTMLInputElement>('#overview-input')!;

function openOverview(): void {
  overview.classList.remove('hidden');
  document.body.classList.add('overview-active');
  searchInput.focus();
}

function closeOverview(): void {
  overview.classList.add('hidden');
  document.body.classList.remove('overview-active');
}

$('#activities').addEventListener('click', () => {
  if (overview.classList.contains('hidden')) openOverview();
  else closeOverview();
});

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  document.querySelectorAll<HTMLElement>('.app-tile').forEach((tile) => {
    const name = tile.querySelector('.app-name')?.textContent?.toLowerCase() ?? '';
    tile.style.display = name.includes(q) ? '' : 'none';
  });
});

// 关闭总览：点击空白或 Esc
overview.addEventListener('click', (e) => {
  if (e.target === overview) closeOverview();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !overview.classList.contains('hidden')) closeOverview();
});

// ---------- 电源菜单 ----------
const powerMenu = $('#power-menu');
$('#power-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  powerMenu.classList.toggle('hidden');
});
document.addEventListener('click', () => powerMenu.classList.add('hidden'));

function confirmPower(action: string): void {
  closeOverview();
  powerMenu.classList.add('hidden');
  openMockWindow(
    `${action} (假的)`,
    `你点的是「${action}」。这是 Windows 上的假 Linux 桌面，什么都没发生。别慌。`
  );
}
$('#pm-lock').addEventListener('click', () => confirmPower('锁定'));
$('#pm-logout').addEventListener('click', () => confirmPower('注销'));
$('#pm-reboot').addEventListener('click', () => confirmPower('重启'));
$('#pm-shutdown').addEventListener('click', () => confirmPower('关机'));

// ---------- 假应用窗口 ----------
function openMockWindow(title: string, body: string): void {
  const ws = $('#workspace');
  const win = document.createElement('section');
  win.className = 'mock-window';
  win.innerHTML = `
    <div class="mw-titlebar">
      <span class="mw-title">${title}</span>
      <div class="mw-controls">
        <button class="mw-btn close" title="关闭">×</button>
      </div>
    </div>
    <div class="mw-body">${body}</div>`;
  win.addEventListener('mousedown', () => {
    // 简单的置顶效果
    ws.querySelectorAll('.mock-window').forEach((w) => w.classList.remove('active'));
    win.classList.add('active');
  });
  win.querySelector('.mw-btn.close')?.addEventListener('click', () => win.remove());
  ws.appendChild(win);
  win.classList.add('active');
}

// ---------- 开屏横幅 ----------
const banner = $('#banner');
const bannerText = $('#banner-text');
function showBanner(b: Banner): void {
  bannerText.textContent = b.zh;
  banner.classList.remove('hidden');
  setTimeout(() => banner.classList.add('hidden'), 4500);
}
const w = (window as unknown as { winux?: { onBanner: (cb: (b: Banner) => void) => void } }).winux;
if (w?.onBanner) w.onBanner(showBanner);

// ---------- 初始化 ----------
renderDesktopIcons();
renderAppGrid();
updateClock();
setInterval(updateClock, 30000);

// ---------- 主题（皮肤）切换 ----------
type Theme = 'gnome' | 'xfce';

function appliedTheme(): Theme {
  return (document.body.dataset.theme as Theme) || 'gnome';
}

function applyTheme(theme: Theme): void {
  document.body.dataset.theme = theme;
  localStorage.setItem('winux.theme', theme);
  const btn = document.getElementById('theme-btn');
  if (btn) btn.title = theme === 'gnome' ? '切换外观：XFCE' : '切换外观：GNOME';
  const pm = document.getElementById('pm-theme');
  if (pm) pm.textContent = theme === 'gnome' ? '切换外观：XFCE' : '切换外观：GNOME';
  const stamp = document.querySelector('.winux-stamp');
  if (stamp) stamp.textContent = theme === 'gnome' ? '此处是 Linux' : '此处仍是 Linux';
}

function toggleTheme(): void {
  applyTheme(appliedTheme() === 'gnome' ? 'xfce' : 'gnome');
  updateXfceClock();
}

// 初始化主题
const savedTheme = localStorage.getItem('winux.theme') as Theme | null;
applyTheme(savedTheme === 'xfce' ? 'xfce' : 'gnome');

// 外观切换按钮 + 电源菜单内切换
const themeBtn = document.getElementById('theme-btn');
themeBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleTheme();
});
const pmTheme = document.getElementById('pm-theme');
pmTheme?.addEventListener('click', () => toggleTheme());
const pmAbout = document.getElementById('pm-about');
pmAbout?.addEventListener('click', () => {
  powerMenu.classList.add('hidden');
  openMockWindow(
    '关于 winux',
    `winux —— 在 Windows 里出生的假 Linux 桌面。<br/><br/>它看起来像 GNOME，摸起来像 XFCE，但它真的就是一个 Windows 进程。<br/>你在看 Linux，别慌。`
  );
});

// ---------- XFCE 面板 ----------
function buildXfceMenu(): HTMLElement {
  const menu = document.createElement('div');
  menu.className = 'xfce-menu';
  const header = document.createElement('div');
  header.className = 'xfce-menu-header';
  header.textContent = 'Applications';
  menu.appendChild(header);
  const list = document.createElement('div');
  list.className = 'xfce-menu-list';
  for (const app of apps) {
    const item = document.createElement('button');
    item.className = 'xfce-menu-item';
    item.innerHTML = `<span class="app-icon" style="background:${app.color}">${app.icon}</span><span>${app.name}</span>`;
    item.addEventListener('click', () => {
      $('#xfce-menu').classList.add('hidden');
      if (app.run) app.run();
      else openMockWindow(`正在打开：${app.name}`, '这是一个假装运行的 Linux 应用。');
    });
    list.appendChild(item);
  }
  menu.appendChild(list);
  return menu;
}

function renderXfceTaskbar(): void {
  const taskbar = document.getElementById('xfce-taskbar');
  if (!taskbar) return;
  taskbar.innerHTML = '';
  // 占位：假装有一个"终端"跑着
  const task = document.createElement('button');
  task.className = 'xfce-task';
  task.innerHTML = `⌨️ 终端`;
  taskbar.appendChild(task);
}

function updateXfceClock(): void {
  const el = document.getElementById('xfce-clock');
  if (!el) return;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  el.textContent = `${hh}:${mm}`;
}

const xfceStart = document.getElementById('xfce-start');
xfceStart?.addEventListener('click', () => {
  const menu = document.getElementById('xfce-menu');
  if (!menu) return;
  if (menu.classList.contains('hidden')) {
    menu.innerHTML = '';
    menu.appendChild(buildXfceMenu());
    menu.classList.remove('hidden');
  } else {
    menu.classList.add('hidden');
  }
});
document.addEventListener('click', (e) => {
  const menu = document.getElementById('xfce-menu');
  if (menu && !menu.classList.contains('hidden')) {
    const target = e.target as HTMLElement;
    if (!target.closest('#xfce-menu') && !target.closest('#xfce-start')) {
      menu.classList.add('hidden');
    }
  }
});

renderXfceTaskbar();
updateXfceClock();
setInterval(updateXfceClock, 30000);

// ---------- 演示钩子（供 WINUX_SHOT 视觉验收）----------
(window as unknown as { __winuxDemo?: (s: string) => void }).__winuxDemo = (state: string): void => {
  if (state === 'overview') openOverview();
  else if (state === 'power') {
    powerMenu.classList.remove('hidden');
  } else if (state === 'app') {
    openMockWindow('文件', '这是一个假装运行的 Linux 文件管理器的空窗口。');
  } else if (state === 'xfce') {
    applyTheme('xfce');
  } else if (state === 'xfce-menu') {
    applyTheme('xfce');
    const menu = document.getElementById('xfce-menu');
    if (menu && menu.classList.contains('hidden')) {
      menu.innerHTML = '';
      menu.appendChild(buildXfceMenu());
      menu.classList.remove('hidden');
    }
  } else if (state === 'about') {
    openMockWindow(
      '关于 winux',
      `winux —— 在 Windows 里出生的假 Linux 桌面。<br/><br/>它看起来像 GNOME，摸起来像 XFCE，但它真的就是一个 Windows 进程。<br/>你在看 Linux，别慌。`
    );
  }
};
