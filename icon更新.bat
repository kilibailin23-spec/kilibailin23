@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo   正在把 icons\ 里的图标重新打包进 data\icons.js ...
echo.

node "tools\build-icons.js"

if errorlevel 1 (
  echo.
  echo   出错了。常见原因：
  echo     1. 没装 Node.js —— 去 https://nodejs.org 装一个
  echo     2. icons\ 文件夹里没有 .png / .svg 文件
  echo.
)

echo.
pause
