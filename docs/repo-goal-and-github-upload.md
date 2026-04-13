# Repository Goal And GitHub Upload Guide

## Goal of this repository

PixelDeck is meant to be a serious, local-first media asset manager for AI-generated images and videos. The repository is structured so a developer can clone it, install dependencies on Windows, run the app and worker locally, import media, and continue building from a strong base.

The intended outcomes of the repo are:

- manage large local image and video libraries efficiently
- keep originals immutable while generating derived browsing assets
- support fast search, filtering, bulk selection, and export workflows
- provide a realistic full-stack project layout suitable for GitHub
- remain easy to run in local single-user mode with SQLite

## What should be uploaded to GitHub

Upload the source code, configuration, schema, docs, scripts, and tests.

Include these directories:

- `app/`
- `components/`
- `docs/`
- `lib/`
- `prisma/`
- `public/`
- `scripts/`
- `tests/`
- `worker/`

Include these root files:

- `README.md`
- `.gitignore`
- `.npmrc`
- `.env.example`
- `package.json`
- `pnpm-lock.yaml`
- `tsconfig.json`
- `next.config.ts`
- `postcss.config.js`
- `tailwind.config.ts`
- `components.json`
- `eslint.config.js`
- `prettier.config.js`
- `Dockerfile`
- `docker-compose.yml`
- `vitest.config.ts`
- `next-env.d.ts`

## What should NOT be uploaded to GitHub

Do not upload local machine state, secrets, generated runtime files, or dependency folders.

Exclude these:

- `.env`
- `node_modules/`
- `.next/`
- `storage/`
- `coverage/`
- `dist/`
- temporary logs
- editor-specific machine files

## Recommended GitHub upload workflow on Windows

If this project is not yet a Git repo:

```powershell
cd C:\dev\PixelDeck
git init
git add .
git commit -m "Initial PixelDeck repository"
```

Create a new empty GitHub repository, then connect and push:

```powershell
git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git
git branch -M main
git push -u origin main
```

If GitHub prompts for authentication, use Git Credential Manager or a Personal Access Token.

## Minimal publish checklist

Before uploading, verify:

- `pnpm install` succeeds
- `pnpm prisma:generate` succeeds
- `pnpm prisma:migrate` succeeds
- `pnpm seed` succeeds
- `pnpm dev` starts the app
- `pnpm worker` starts the worker
- `.env` is not staged
- `storage/` is not staged
- `node_modules/` is not staged

## Good repository description

Suggested GitHub repository description:

`Local-first AI media asset manager for large image and video libraries with Next.js, Prisma, SQLite, virtualized gallery browsing, and background import/export workers.`

## Suggested topics

Suggested GitHub topics:

- `nextjs`
- `typescript`
- `prisma`
- `sqlite`
- `tailwindcss`
- `media-manager`
- `asset-management`
- `ffmpeg`
- `ai-images`
- `image-library`

## Notes for another AI or developer generating a repo from this project

If another AI system or developer is using this repository as the base for a generated GitHub project, keep these principles intact:

- preserve the local-first storage design
- preserve immutable originals plus derived thumbnails/previews/posters
- keep the worker separate from the web app
- keep SQLite as the default dev path
- avoid putting secrets or local storage artifacts into version control
- prefer UTF-8 file encoding for all source files on Windows
- prefer a local executable path like `C:\dev\PixelDeck` for development