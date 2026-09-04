// 把 src/ui 下的静态资源（HTML/CSS/图片）复制到 dist/ui，供 Electron 加载。
const fs = require('fs');
const path = require('path');

const srcUi = path.join(__dirname, '..', 'src', 'ui');
const dstUi = path.join(__dirname, '..', 'dist', 'ui');

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else if (!/\.(ts|map)$/.test(entry.name)) {
      fs.copyFileSync(s, d);
    }
  }
}

copyDir(srcUi, dstUi);
console.log('copied static ui files -> dist/ui');
