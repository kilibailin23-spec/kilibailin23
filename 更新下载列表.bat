@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   正在扫描 files\ 文件夹，更新 data\files.js 里的下载清单 ...
echo.
node "tools\build-files.js"
if errorlevel 1 (
  echo.
  echo   出错了。常见原因：
  echo     1. 没装 Node.js —— 去 https://nodejs.org 装一个
  echo     2. data\files.js 被改坏了，里面找不到 const FILES
  echo.
)
echo.
pause
