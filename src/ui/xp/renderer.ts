// winux XP 皮肤渲染逻辑
// 在 Windows 11 上伪装成 Windows XP 桌面的外壳替换。
(() => {

type Banner = { en: string; zh: string };
type WinuxBridge = {
  onBanner?: (cb: (b: Banner) => void) => void;
  openCmd?: () => Promise<void>;
  openExplorer?: () => Promise<void>;
  shutdown?: () => Promise<void>;
};
const w = (window as unknown as { winux?: WinuxBridge }).winux;

const $ = (sel: string): HTMLElement => {
  const el = document.querySelector<HTMLElement>(sel);
  if (!el) throw new Error(`missing ${sel}`);
  return el;
};

// ---------- 时钟 ----------
function tickClock(): void {
  const n = new Date();
  const hh = String(n.getHours()).padStart(2, '0');
  const mm = String(n.getMinutes()).padStart(2, '0');
  $('#xp-clock').textContent = `${hh}:${mm}`;
}

// ---------- 桌面图标 ----------
const icons = [
  { label: '我的电脑', icon: '🖥️', act: '电脑' },
  { label: '我的文档', icon: '📁', act: '文档' },
  { label: '回收站', icon: '🗑️', act: '回收站' },
  { label: 'Internet Explorer', icon: '🌐', act: 'ie' },
  { label: '我的公文包', icon: '💼', act: '包' },
  { label: '记事本', icon: '📝', act: 'note' },
];
function renderIcons(): void {
  const wrap = $('#desktop-icons');
  wrap.innerHTML = '';
  for (const ic of icons) {
    const el = document.createElement('div');
    el.className = 'xp-icon';
    el.innerHTML = `<span class="icon">${ic.icon}</span><span class="label">${ic.label}</span>`;
    el.addEventListener('click', () => handleIcon(ic.act));
    wrap.appendChild(el);
  }
}

function handleIcon(act: string): void {
  if (act === '电脑') {
    if (w?.openExplorer) void w.openExplorer();  // 真资源管理器
    else openWindow('我的电脑', '这是一个真的 Windows 资源管理器窗口（用任务栏切换）。');
  } else if (act === 'ie') {
    openWindow('Internet Explorer', 'IE 早已退休。这里是 Windows 11 的 2026 年。');
  } else if (act === 'note') {
    openWindow('记事本', '这是一个伪装成 XP 记事本的窗口。');
  } else {
    openWindow(act, `「${act}」是一个假的 XP 窗口。`);
  }
}

// ---------- 窗口（XP 立体边框）----------
let windowCount = 0;
function openWindow(title: string, body: string): void {
  windowCount++;
  const layer = $('#window-layer');
  const win = document.createElement('div');
  win.className = 'xp-window active';
  win.style.left = `${40 + windowCount * 24}px`;
  win.style.top = `${30 + windowCount * 20}px`;
  win.style.width = '380px';
  win.innerHTML = `
    <div class="xp-titlebar"><span class="xp-title">${title}</span><span class="xp-x">×</span></div>
    <div class="xp-body">${body}</div>`;
  win.querySelector('.xp-x')?.addEventListener('click', () => win.remove());
  win.addEventListener('mousedown', () => {
    layer.querySelectorAll('.xp-window').forEach((x) => x.classList.remove('active'));
    win.classList.add('active');
  });
  // 拖动
  win.addEventListener('mousedown', (e) => {
    const tb = (e.target as HTMLElement).closest('.xp-titlebar');
    if (!tb) return;
    const startX = e.clientX - win.offsetLeft;
    const startY = e.clientY - win.offsetTop;
    const move = (ev: MouseEvent) => {
      win.style.left = `${ev.clientX - startX}px`;
      win.style.top = `${ev.clientY - startY}px`;
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });
  layer.appendChild(win);
  addTaskButton(title, win);
}

function addTaskButton(title: string, win: HTMLElement): void {
  const tb = $('#task-buttons');
  const btn = document.createElement('button');
  btn.className = 'task-btn active';
  btn.textContent = title;
  btn.addEventListener('click', () => {
    if (win.isConnected) {
      windowCount; // noop
      const layer = $('#window-layer');
      layer.querySelectorAll('.xp-window').forEach((x) => x.classList.remove('active'));
      win.classList.add('active');
      layer.querySelectorAll('.task-btn').forEach((x) => x.classList.remove('active'));
      btn.classList.add('active');
    }
  });
  tb.appendChild(btn);
  win.addEventListener('mousedown', () => {
    tb.querySelectorAll('.task-btn').forEach((x) => x.classList.remove('active'));
    btn.classList.add('active');
  });
  win.addEventListener('closed', () => btn.remove());
}

// ---------- 开始菜单 ----------
const startMenu = $('#start-menu');
function buildStartMenu(): void {
  const header = `<div class="sm-header">Windows XP <span style="font-size:11px;font-weight:400">| 但它其实是 Windows 11</span></div>`;
  const leftItems = [
    { label: 'Internet Explorer', icon: '🌐' },
    { label: '我的文档', icon: '📁' },
    { label: '我的电脑', icon: '🖥️' },
  ];
  const left = leftItems.map((i) => `<div class="sm-left-item"><span class="ic">${i.icon}</span>${i.label}</div>`).join('');
  const right = ['所有程序', '控制面板', '帮助和支持', '搜索', '运行...'].map(
    (r) => `<a class="sm-right-item">${r}</a>`
  ).join('');
  const footer = `
    <div class="sm-footer">
      <span class="sm-logoff" id="sm-logoff">🔓 注销</span>
      <span class="sm-shutdown" id="sm-shutdown">⏻ 关闭计算机</span>
    </div>`;
  startMenu.innerHTML = header
    + `<div class="sm-body"><div class="sm-left">${left}</div><div class="sm-right">${right}</div><div style="clear:both"></div></div>`
    + footer;

  startMenu.querySelectorAll('.sm-left-item, .sm-right-item').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const txt = el.textContent?.trim() ?? '';
      toggleStartMenu(false);
      if (txt.includes('我的电脑')) { if (w?.openExplorer) void w.openExplorer(); else openWindow('我的电脑', '真资源管理器'); }
      else if (txt.includes('Internet Explorer')) openWindow('Internet Explorer', 'IE 已经退休了。');
      else if (txt.includes('记事本') || txt.includes('搜索')) openWindow(txt, `假 XP 窗口：${txt}`);
      else openWindow(txt, `这是 XP 的「${txt}」，但底下是 Windows 11。`);
    });
  });
  const lg = startMenu.querySelector('#sm-logoff');
  lg?.addEventListener('click', (e) => { e.stopPropagation(); toggleStartMenu(false); if (w?.openCmd) void w.openCmd(); });
  const sd = startMenu.querySelector('#sm-shutdown');
  sd?.addEventListener('click', (e) => { e.stopPropagation(); toggleStartMenu(false); openShutdownBox(); });
}

function toggleStartMenu(show?: boolean): void {
  const want = show ?? startMenu.classList.contains('hidden');
  if (want) { buildStartMenu(); startMenu.classList.remove('hidden'); }
  else startMenu.classList.add('hidden');
}
$('#start-btn').addEventListener('click', (e) => { e.stopPropagation(); toggleStartMenu(); });
document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (!startMenu.classList.contains('hidden') && !t.closest('#start-menu') && !t.closest('#start-btn')) {
    startMenu.classList.add('hidden');
  }
});

// ---------- 关机框 ----------
function openShutdownBox(): void {
  const box = $('#shutdown-box');
  box.classList.remove('hidden');
  box.style.left = `calc(50% - 120px)`;
  box.style.top = `40%`;
  box.classList.add('active');
}
$('#sd-cancel').addEventListener('click', () => $('#shutdown-box').classList.add('hidden'));
$('#sd-do').addEventListener('click', () => {
  $('#shutdown-box').classList.add('hidden');
  if (w?.shutdown) void w.shutdown();
  else { alert('关机（假）。恢复桌面'); }
});

// ---------- 快速启动 ----------
$('#ql-desk').addEventListener('click', () => {
  $('#window-layer').querySelectorAll('.xp-window').forEach((x) => x.remove());
  $('#task-buttons').innerHTML = '';
});
$('#ql-ie').addEventListener('click', () => openWindow('Internet Explorer', 'IE 已退役。这里是 Windows 11。'));

// ---------- 横幅 ----------
const banner = $('#banner');
const bannerText = $('#banner-text');
if (w?.onBanner) w.onBanner((b) => {
  bannerText.textContent = b.zh;
  banner.classList.remove('hidden');
  setTimeout(() => banner.classList.add('hidden'), 4500);
});

// ---------- 初始化 ----------
renderIcons();
tickClock();
setInterval(tickClock, 30000);

})();

