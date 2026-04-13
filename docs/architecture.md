# Architecture

PixelDeck uses a Next.js application for the UI and APIs, Prisma for relational data access, SQLite for local-first metadata storage, and a dedicated worker loop for imports and exports. Derived media assets are stored alongside immutable originals so the app can browse quickly without decoding originals in the viewport.
