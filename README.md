# winux 🐧💻

> **把整个 Windows 桌面壳换成 Linux。没有 WSL，没有虚拟机，就是一个普通 Windows 进程在硬装。**
>
> 双击，Windows 任务栏没了，整个屏幕是一个 Linux 桌面。你看着是 Windows，你在看 Linux，别慌。

## 这是什么

`winux` 是原生 Windows 应用程序（Electron，**不借 WSL、不用虚拟机**），它做的不是"弹个 Linux 样子的窗口"，而是：

1. **杀掉 Windows 桌面壳**（`explorer.exe`），接管整块屏幕。
2. 屏幕上只剩一个 **GNOME / XFCE 外观的 Linux 桌面**——顶部栏、Activities、应用网格、底部面板，看着就是 Linux。
3. 桌面里的**"终端"打开的是真正的 Windows CMD**（`cmd.exe`）——Linux 桌面住着个 Windows CMD，荒诞拉满。
4. 桌面**抢占 `Alt+F4` 等 Windows 组合键**——别想用 Windows 的习惯关掉它，它现在自己是"系统"。
5. 用累了，在桌面里点"关机"（或按 `Alt+Q`），**Windows 桌面完整恢复**，一切如初。

**它真就是一个 Electron 进程在假装整个 Linux 桌面环境。** 没有 Linux 内核，没有任何 Linux 二进制，全是 Windows。

## 为什么做这个

因为"在 Windows 上跑 Linux 桌面，还不靠 WSL/虚拟机"这件事本身就是个冷笑话。第一反应"这得用 WSL 吧？"——不用。这就是整活，而且整得能让别人信。

## 功能

- 🖥️ **替换桌面壳**：接管时关闭 `explorer.exe`，全屏显示 Linux 桌面（有看门狗 + Windows 自动重启双保险，桌面包回来，不会丢）。
- 🔍 **GNOME 外观**：顶部栏（Activities / 时钟 / 状态图标）、桌面图标、暗色主题、Activities 总览缩放搜索 + 应用网格。
- 🐧 **XFCE 外观**：一键切换，底部面板 + 应用菜单 + 时钟。
- ⌨️ **真·CMD 终端**：点"终端"→ 拉起真正的 `cmd.exe`，可敲命令、可 `exit`。
- ⚡ **组合键拦截**：`Alt+F4` 被桌面"吃掉"（当作关机，恢复桌面退出）；`Alt+Tab` 等被拦截。
- 💬 **开屏横幅**："这是 Windows，你在看 Linux，别慌。"

## 安全 / 可回退

- 接管时用 `taskkill /f /im explorer.exe` 关闭桌面壳；退出（含异常）自动 `start explorer.exe` 恢复。
- 拉了一个独立 `watchdog.cmd`：万一 winux 被强杀，它自动帮你把 Windows 桌面拉回来。
- Windows 也会在 explorer 被杀后自动重启它。**三重保险，桌面回不来几乎不可能。**

## 安装与运行

需要 [Node.js](https://nodejs.org) 18+。

```bash
git clone https://github.com/Seanding1998/winux.git
cd winux
npm install
npm run build && npm start    # 开发模式（安全起见启动不接管，登录后点"接管屏幕"）
npm run dist                  # 打包成 release/winux-portable.zip
```

> **提醒**：直接跑 `npm start` 是安全预览（不杀 explorer）。要体验"真接管"，打包后用 `release/win-unpacked/winux.exe`，或给应用加一个"接管屏幕"按钮。

## 技术细节

- Electron + TypeScript，渲染层纯 HTML/CSS/JS。
- 主进程 `main.ts`：`killExplorer` / `restoreExplorer`、`openCmd`（spawn `cmd.exe`）、组合键拦截。
- 看门狗 `scripts/watchdog.cmd`：独立进程，主进程被杀时自动恢复桌面。
- 皮肤切换用 `data-theme` 属性，配置持久化走 `localStorage`。

## 免责声明

这真的是 Windows 在假装 Linux。它装的还挺像——连你自己都差点信了。😏

## License

MIT
