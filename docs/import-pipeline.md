# Import pipeline

The worker scans a folder, filters supported media types, computes SHA-256 hashes, skips duplicates, copies originals into immutable storage, extracts metadata, generates thumbnails/previews/posters, inserts asset rows, and syncs the FTS index.
