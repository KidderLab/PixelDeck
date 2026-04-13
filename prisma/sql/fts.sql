CREATE VIRTUAL TABLE IF NOT EXISTS "asset_fts" USING fts5(
  assetId UNINDEXED,
  filename,
  displayName,
  promptText,
  source,
  tags,
  searchableText,
  tokenize = 'porter unicode61'
);
