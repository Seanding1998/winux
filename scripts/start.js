// 启动 winux，可选皮肤参数：node scripts/start.js xp
const { spawn } = require('child_process');
const path = require('path');
const skin = process.argv[2] || 'gnome';
const electron = require('electron'); // 返回 electron 可执行文件路径
const appPath = path.join(__dirname, '..');
const env = { ...process.env, WINUX_SKIN: skin };
const proc = spawn(electron, [appPath], { env, stdio: 'inherit', cwd: appPath });
proc.on('close', (code) => process.exit(code ?? 0));
