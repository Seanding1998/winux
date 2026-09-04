@echo off
rem winux 看门狗：winux 主进程被强杀时，自动恢复 Windows 桌面（explorer）。
rem 由 winux 主进程接管时以 detached 方式拉起。它独立于 winux 生存。

set WINUX_PID=%~1
if "%WINUX_PID%"=="" (
  echo [watchdog] no pid provided, exiting
  exit /b 0
)

:loop
rem 1. 检查 explorer 是否在跑
tasklist /FI "IMAGENAME eq explorer.exe" 2>nul | find /I "explorer.exe" >nul
if errorlevel 1 (
  rem explorer 不在 -> winux 可能已退出或崩溃，确认 winux 是否存活
  tasklist /FI "PID eq %WINUX_PID%" 2>nul | findstr "%WINUX_PID%" >nul
  if errorlevel 1 (
    rem winux 也没了 -> 恢复 Windows 桌面
    echo [watchdog] winux gone, restoring desktop
    start "" explorer.exe
    exit /b 0
  )
)
timeout /t 3 /nobreak >nul
goto loop
