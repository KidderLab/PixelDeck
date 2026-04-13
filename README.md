# PixelDeck

PixelDeck is a local-first browser application for managing very large image and video libraries. It is designed for workflows where you may have thousands to hundreds of thousands of generated or curated assets and need fast browsing, filtering, selection, collections, imports, and ZIP exports on consumer hardware.

## What PixelDeck does

- browses large libraries with a virtualized grid and table view
- imports folders recursively
- prevents exact duplicates with SHA-256 hashing
- generates thumbnails, previews, and video poster frames
- tracks import jobs and export jobs
- exports selected assets as ZIP files
- supports local-first storage and a SQLite-first setup

## Windows quick start

Use the repo from:

- `C:\dev\PixelDeck`

Do not run the dev environment from restricted mounted drives if Node tools fail there.

## Easiest way to run on Windows

### One-time setup

From `C:\dev\PixelDeck`:

```powershell
.\setup-windows.bat
```

This will:

- install dependencies
- create `.env` if needed
- create storage folders
- generate Prisma client
- apply the schema
- seed initial data

### Start the app and worker with one double-click

Use:

- `start-pixeldeck.bat`

You can:

- double-click it in File Explorer, or
- run it from PowerShell:

```powershell
.\start-pixeldeck.bat
```

This opens:

- one terminal for the web app
- one terminal for the worker
- the browser at `http://localhost:3000`

### Start only the web app

```powershell
.\start-app.bat
```

### Start only the worker

```powershell
.\start-worker.bat
```

## Run from the command line

From `C:\dev\PixelDeck`:

### Start the web app

```powershell
pnpm dev
```

### Start the worker

```powershell
pnpm worker
```

You usually want both running at the same time.

Recommended pattern:

Terminal 1:

```powershell
pnpm dev
```

Terminal 2:

```powershell
pnpm worker
```

## Open the app

After starting the app:

- [http://localhost:3000](http://localhost:3000)

Useful endpoints:

- health: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- imports: [http://localhost:3000/api/imports](http://localhost:3000/api/imports)
- exports: [http://localhost:3000/api/exports](http://localhost:3000/api/exports)
- settings: [http://localhost:3000/settings](http://localhost:3000/settings)

## Everyday usage

### Browse the library

Main library view features:

- `Grid` / `Table` toggle
- `Small`, `Medium`, `Large` thumbnail density
- search box
- date field selector
- date range selector
- sort selector
- folder badge when browsing a specific imported folder
- total asset count in current view

### Select assets

Selection behavior:

- click: select one asset
- Ctrl/Cmd-click: add or remove one asset
- Shift-click: range select
- `Select Visible`: select current loaded/buffered view
- `Clear`: clear selection

### Export ZIP

1. Select assets
2. Click `Export ZIP`
3. Keep the worker running
4. Wait for the export job to complete

ZIPs are stored in:

- configured storage root `zips/`

## Importing media

PixelDeck supports two practical import paths.

### 1. Web app import

The current web import flow is available in the empty-library onboarding experience.

You can:

- drag and drop files
- click `Import Folder`
- click `Choose Files`

Important note:

- in the current build, once the library is already populated, there is not yet a permanent top-toolbar import button
- for repeated imports, the command line import is the most reliable method right now

## 2. Command-line folder import

This is the recommended ongoing workflow for importing more folders.

General form:

```powershell
pnpm import:folder -- --folder "FULL_PATH_TO_FOLDER" --source "LABEL"
```

Example:

```powershell
pnpm import:folder -- --folder "D:\images\2026_April" --source "2026-April"
```

What it does:

- creates an import job
- scans the folder recursively
- computes hashes
- skips exact duplicates
- copies originals into managed storage
- creates thumbnails/previews/posters
- updates the database and search index

### Safe to import folders again?

Yes.

If some assets were already imported:

- exact duplicate files are skipped by SHA-256 hash
- import job history still records the attempt

## Import command examples

From `C:\dev\PixelDeck`:

```powershell
pnpm import:folder -- --folder "Z:\easystore\MEDIA\Midjourney images\2024_December_2nd" --source "midjourney-2024-december-2nd"
pnpm import:folder -- --folder "Z:\easystore\MEDIA\Midjourney images\2025_August" --source "midjourney-2025-august"
pnpm import:folder -- --folder "Z:\easystore\MEDIA\Midjourney images\2025_June" --source "midjourney-2025-june"
pnpm import:folder -- --folder "Z:\easystore\MEDIA\Midjourney images\2024_December" --source "midjourney-2024-december"
```

### Import an entire parent folder recursively

```powershell
pnpm import:folder -- --folder "Z:\easystore\MEDIA\Midjourney images" --source "midjourney-root"
```

That will scan all nested subfolders recursively.

## Import status and history

Use the UI pages:

- [http://localhost:3000/imports](http://localhost:3000/imports)
- [http://localhost:3000/folders](http://localhost:3000/folders)

What you can see there:

- import job status
- duplicates/skipped counts
- folder groupings
- recent imports

## Storage location

The active storage paths are visible in:

- [http://localhost:3000/settings](http://localhost:3000/settings)

The detail drawer for an asset also shows:

- original filename
- stored file path

## Moving storage to another drive

If you want media storage on another drive such as `F:`:

```powershell
.\move-storage-to-drive.ps1 -TargetRoot "F:\PixelDeck"
```

Optional cleanup after a successful move:

```powershell
.\move-storage-to-drive.ps1 -TargetRoot "F:\PixelDeck" -RemoveOldStorage
```

After moving storage, restart:

```powershell
pnpm dev
pnpm worker
```

## Private remote access

For private use from another computer, the recommended setup is Tailscale.

- keep PixelDeck running locally on port `3000`
- do not expose raw port `3000` to the public internet
- use Tailscale Serve so access stays inside your private tailnet

Start PixelDeck first:

```powershell
.\start-pixeldeck.bat
```

Then enable private remote access:

```powershell
.\enable-remote-tailscale.bat
```

If `tailscale` is not recognized in PowerShell, PixelDeck's helper script will try the default Windows install path:

```text
C:\Program Files\Tailscale\tailscale.exe
```

To see the private URL after setup, run:

```powershell
"C:\Program Files\Tailscale\tailscale.exe" serve status
```

For a fuller guide, see:

- [Tailscale remote access](docs/tailscale-remote-access.md)

## Useful development commands

### Generate Prisma client

```powershell
pnpm prisma:generate
```

### Update local SQLite schema

```powershell
pnpm prisma:migrate
```

### Seed starter data

```powershell
pnpm seed
```

### Rebuild thumbnails/previews

```powershell
pnpm rebuild:thumbs
```

### Rebuild search index

```powershell
pnpm reindex:search
```

### Run tests

```powershell
pnpm test
```

### Type-check

```powershell
pnpm typecheck
```

### Build production bundle

```powershell
pnpm build
```

### Run production server

```powershell
pnpm start
```

## Video handling

Current behavior:

- grid shows poster thumbnails for videos
- video cards display a `Video` badge
- video cards display duration overlay
- detail drawer uses a real `<video controls>` player
- hover preview is off by default to avoid unnecessary decoding/load

This keeps the main browsing view responsive while still making videos usable.

## Troubleshooting

### `pnpm` not recognized

```powershell
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm --version
```

### Worker is not processing imports or exports

Start it again:

```powershell
pnpm worker
```

### Imports are pending

Usually means:

- the worker is not running
- or a large import is still being processed

Check:

- [http://localhost:3000/imports](http://localhost:3000/imports)

### ZIP export says it is building but does not download

Usually means:

- export job is queued
- worker is not actively processing it

Start or restart the worker:

```powershell
pnpm worker
```

### Storage path problems

Check active paths at:

- [http://localhost:3000/settings](http://localhost:3000/settings)

## Current limitation to know

The current populated-library UI does not yet have a permanent always-visible `Import Folder` button in the top toolbar. Command-line folder import is the reliable repeated-import path right now.

## Main docs

- [Architecture](docs/architecture.md)
- [Performance](docs/performance.md)
- [Schema](docs/schema.md)
- [Import pipeline](docs/import-pipeline.md)
- [Deployment](docs/deployment.md)
- [Troubleshooting](docs/troubleshooting.md)
- [PostgreSQL migration](docs/postgresql-migration.md)
- [Keyboard shortcuts](docs/keyboard-shortcuts.md)
- [Tailscale remote access](docs/tailscale-remote-access.md)
- [Repository goal and GitHub upload guide](docs/repo-goal-and-github-upload.md)
