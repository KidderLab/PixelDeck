@echo off
setlocal
cd /d "%~dp0"

echo [PixelDeck] Launching app and worker in separate windows...
start "PixelDeck App" cmd /k "cd /d %~dp0 && start-app.bat"
start "PixelDeck Worker" cmd /k "cd /d %~dp0 && start-worker.bat"
timeout /t 4 /nobreak >nul
start "" http://localhost:3000
