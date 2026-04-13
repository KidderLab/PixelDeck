@echo off
setlocal
cd /d "%~dp0"

set "TAILSCALE_EXE=C:\Program Files\Tailscale\tailscale.exe"

if not exist "%TAILSCALE_EXE%" (
  where tailscale >nul 2>nul && set "TAILSCALE_EXE=tailscale"
)

if not exist "%TAILSCALE_EXE%" if /I not "%TAILSCALE_EXE%"=="tailscale" (
  echo Tailscale was not found at:
  echo   C:\Program Files\Tailscale\tailscale.exe
  echo.
  echo Install it from:
  echo   https://tailscale.com/download/windows
  pause
  exit /b 1
)

if /I "%TAILSCALE_EXE%"=="tailscale" (
  echo [PixelDeck Remote] Using Tailscale from PATH.
) else (
  echo [PixelDeck Remote] Using:
  echo   %TAILSCALE_EXE%
)

echo [PixelDeck Remote] Enabling private Tailscale access for http://127.0.0.1:3000 ...
call "%TAILSCALE_EXE%" serve 3000
if errorlevel 1 (
  echo.
  echo [PixelDeck Remote] Failed to configure Tailscale Serve.
  echo Make sure:
  echo   1. You are signed in to Tailscale
  echo   2. The PixelDeck app is running locally on port 3000
  echo   3. HTTPS/Serve is enabled in your tailnet when prompted
  pause
  exit /b 1
)

echo.
echo [PixelDeck Remote] PixelDeck should now be reachable from your tailnet.
if /I "%TAILSCALE_EXE%"=="tailscale" (
  echo Run "tailscale serve status" to see the private URL.
) else (
  echo Run:
  echo   "%TAILSCALE_EXE%" serve status
  echo to see the private URL.
)
pause
