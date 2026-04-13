@echo off
setlocal
cd /d "%~dp0"

echo [PixelDeck Setup] Checking prerequisites...
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
    echo [PixelDeck Setup] Created .env from .env.example
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

echo [PixelDeck Setup] Installing dependencies...
call pnpm install || goto :fail

echo [PixelDeck Setup] Generating Prisma client...
call pnpm prisma:generate || goto :fail

echo [PixelDeck Setup] Updating database schema...
call pnpm prisma:migrate || goto :fail

echo [PixelDeck Setup] Seeding initial data...
call pnpm seed || goto :fail

echo.
echo [PixelDeck Setup] Setup complete.
echo Double-click start-pixeldeck.bat to launch the app and worker.
pause
exit /b 0

:fail
echo.
echo [PixelDeck Setup] Setup failed. Review the error above.
pause
exit /b 1
