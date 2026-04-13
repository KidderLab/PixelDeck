# Performance

PixelDeck keeps the browser responsive by virtualizing the gallery, using cursor-based API pagination, serving thumbnails instead of originals, and moving expensive media processing into a background worker. SQLite is suitable for single-user local libraries; PostgreSQL is the upgrade path for more concurrent deployments.
