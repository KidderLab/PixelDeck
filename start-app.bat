@echo off
setlocal
cd /d "%~dp0"

echo [PixelDeck] Checking prerequisites...
where node >nul 2>nul || (
  echo Node.js is not installed or not on PATH.
  pause
  exit /b 1
)
where pnpm >nul 2>nul || (
  echo pnpm is not installed or not on PATH.
  echo Run: corepack enable
  echo Then: corepack prepare pnpm@9.15.0 --activate
  pause
  exit /b 1
)

if not exist ".env" (
  if exist ".env.example" (
    copy /Y ".env.example" ".env" >nul
    echo [PixelDeck] Created .env from .env.example
  )
)

if not exist "storage" mkdir "storage"
if not exist "storage\db" mkdir "storage\db"
if not exist "storage\imports" mkdir "storage\imports"
if not exist "storage\originals" mkdir "storage\originals"
if not exist "storage\thumbs" mkdir "storage\thumbs"
if not exist "storage\previews" mkdir "storage\previews"
if not exist "storage\video-posters" mkdir "storage\video-posters"
if not exist "storage\zips" mkdir "storage\zips"
if not exist "storage\logs" mkdir "storage\logs"

echo [PixelDeck] Starting web app...
call pnpm dev
