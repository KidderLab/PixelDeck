# Schema

The schema centers on `Asset`, with supporting many-to-many tables for `Tag` and `Collection`, plus background job models for imports and exports. `searchableText` and the `asset_fts` table provide practical local full-text search in SQLite.
