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

set "PIXELDECK_STORAGE_ROOT=storage"
set "PIXELDECK_IMPORT_ROOT=%PIXELDECK_STORAGE_ROOT%\imports"
set "PIXELDECK_ORIGINALS_ROOT=%PIXELDECK_STORAGE_ROOT%\originals"
set "PIXELDECK_THUMBS_ROOT=%PIXELDECK_STORAGE_ROOT%\thumbs"
set "PIXELDECK_PREVIEWS_ROOT=%PIXELDECK_STORAGE_ROOT%\previews"
set "PIXELDECK_POSTERS_ROOT=%PIXELDECK_STORAGE_ROOT%\video-posters"
set "PIXELDECK_ZIPS_ROOT=%PIXELDECK_STORAGE_ROOT%\zips"
set "PIXELDECK_LOG_ROOT=%PIXELDECK_STORAGE_ROOT%\logs"
set "DATABASE_URL=file:storage/db/dev.db"

if exist ".env" (
  for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    if /I "%%A"=="PIXELDECK_STORAGE_ROOT" set "PIXELDECK_STORAGE_ROOT=%%B"
    if /I "%%A"=="PIXELDECK_IMPORT_ROOT" set "PIXELDECK_IMPORT_ROOT=%%B"
    if /I "%%A"=="PIXELDECK_ORIGINALS_ROOT" set "PIXELDECK_ORIGINALS_ROOT=%%B"
    if /I "%%A"=="PIXELDECK_THUMBS_ROOT" set "PIXELDECK_THUMBS_ROOT=%%B"
    if /I "%%A"=="PIXELDECK_PREVIEWS_ROOT" set "PIXELDECK_PREVIEWS_ROOT=%%B"
    if /I "%%A"=="PIXELDECK_POSTERS_ROOT" set "PIXELDECK_POSTERS_ROOT=%%B"
    if /I "%%A"=="PIXELDECK_ZIPS_ROOT" set "PIXELDECK_ZIPS_ROOT=%%B"
    if /I "%%A"=="PIXELDECK_LOG_ROOT" set "PIXELDECK_LOG_ROOT=%%B"
    if /I "%%A"=="DATABASE_URL" set "DATABASE_URL=%%B"
  )
)

set "DB_FILE_PATH=%DATABASE_URL:file=%"
for %%I in ("%DB_FILE_PATH%") do set "DB_DIR=%%~dpI"

echo [PixelDeck Setup] Preparing storage folders...
call :ensure_dir "%PIXELDECK_STORAGE_ROOT%"
call :ensure_dir "%DB_DIR%"
call :ensure_dir "%PIXELDECK_IMPORT_ROOT%"
call :ensure_dir "%PIXELDECK_ORIGINALS_ROOT%"
call :ensure_dir "%PIXELDECK_THUMBS_ROOT%"
call :ensure_dir "%PIXELDECK_PREVIEWS_ROOT%"
call :ensure_dir "%PIXELDECK_POSTERS_ROOT%"
call :ensure_dir "%PIXELDECK_ZIPS_ROOT%"
call :ensure_dir "%PIXELDECK_LOG_ROOT%"

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

:ensure_dir
if "%~1"=="" exit /b 0
if not exist "%~1" mkdir "%~1"
exit /b 0
