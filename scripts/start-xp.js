// 打包 XP 皮肤（固化 settings.json 后产出默认 XP 桌面的 exe）
process.env.WINUX_SKIN = 'xp';
require('./build-release.js');
