// 生成可分发的 winux 应用（绕开 electron-builder 在部分环境下解压 electron.exe 失败的问题）
// 流程：build dist -> 组装 win-unpacked -> pack app.asar -> 打 zip
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const releaseDir = path.join(root, 'release');
const unpackedDir = path.join(releaseDir, 'win-unpacked');
const electronDist = path.join(root, 'node_modules', 'electron', 'dist');
const zipOut = path.join(releaseDir, 'winux-portable.zip');

function sh(cmd) {
  console.log('>', cmd);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

function main() {
  // 1. 编译
  sh('npm run build');

  // 2. 清空并装载完整 electron 运行时（含 electron.exe，稍后重命名）
  fs.rmSync(unpackedDir, { recursive: true, force: true });
  fs.mkdirSync(unpackedDir, { recursive: true });
  fs.cpSync(electronDist, unpackedDir, { recursive: true });

  // 3. 把 electron.exe 重命名为应用名
  fs.renameSync(
    path.join(unpackedDir, 'electron.exe'),
    path.join(unpackedDir, 'winux.exe')
  );

  // 4. 把我们的应用打成 app.asar 放进 resources
  const staging = path.join(root, '.asar-tmp');
  fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(path.join(staging, 'dist'), { recursive: true });
  fs.cpSync(path.join(root, 'dist'), path.join(staging, 'dist'), { recursive: true });
  fs.copyFileSync(path.join(root, 'package.json'), path.join(staging, 'package.json'));
  fs.mkdirSync(path.join(unpackedDir, 'resources'), { recursive: true });
  sh(`npx asar pack ${staging} ${path.join(unpackedDir, 'resources', 'app.asar')}`);
  fs.rmSync(staging, { recursive: true, force: true });

  // 5. 把看门狗脚本复制到打包根目录（主进程从 process.execPath 旁查找）
  const watchdogSrc = path.join(root, 'scripts', 'watchdog.cmd');
  if (fs.existsSync(watchdogSrc)) {
    fs.copyFileSync(watchdogSrc, path.join(unpackedDir, 'watchdog.cmd'));
  }

  // 6. 打一个便携 zip
  fs.rmSync(zipOut, { force: true });
  sh(`powershell -Command "Compress-Archive -Path '${unpackedDir}\\*' -DestinationPath '${zipOut}' -Force"`);

  console.log('\n✅ 构建完成。');
  console.log('   可运行应用目录:', unpackedDir);
  console.log('   便携包 zip:    ', zipOut);
}

main();
