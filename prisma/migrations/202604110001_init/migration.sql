PRAGMA foreign_keys=OFF;

CREATE TABLE "Asset" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "originalFilename" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "mediaType" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "extension" TEXT NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "durationMs" INTEGER,
  "aspectRatio" REAL,
  "orientation" TEXT,
  "fileSizeBytes" BIGINT NOT NULL,
  "sha256" TEXT NOT NULL,
  "perceptualHash" TEXT,
  "originalPath" TEXT NOT NULL,
  "thumbnailPath" TEXT,
  "previewPath" TEXT,
  "posterPath" TEXT,
  "source" TEXT NOT NULL,
  "promptText" TEXT,
  "modelName" TEXT,
  "generationDate" DATETIME,
  "importedAt" DATETIME NOT NULL,
  "capturedAt" DATETIME,
  "favorite" BOOLEAN NOT NULL DEFAULT false,
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" DATETIME,
  "metadataJson" JSONB NOT NULL,
  "searchableText" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Tag" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "color" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AssetTag" (
  "assetId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  PRIMARY KEY ("assetId", "tagId"),
  CONSTRAINT "AssetTag_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AssetTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Collection" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CollectionAsset" (
  "collectionId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("collectionId", "assetId"),
  CONSTRAINT "CollectionAsset_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CollectionAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ImportJob" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceFolder" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "totalDiscovered" INTEGER NOT NULL DEFAULT 0,
  "processedCount" INTEGER NOT NULL DEFAULT 0,
  "duplicateCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "skippedCount" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "lastProcessedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ExportJob" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "assetIdsJson" JSONB NOT NULL,
  "zipPath" TEXT,
  "progressCount" INTEGER NOT NULL DEFAULT 0,
  "totalCount" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "SavedSearch" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "queryJson" JSONB NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AppSetting" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "valueJson" JSONB NOT NULL,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Asset_sha256_key" ON "Asset"("sha256");
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");
CREATE UNIQUE INDEX "Collection_name_key" ON "Collection"("name");
CREATE UNIQUE INDEX "SavedSearch_name_key" ON "SavedSearch"("name");
CREATE INDEX "Asset_mediaType_archived_importedAt_idx" ON "Asset"("mediaType", "archived", "importedAt" DESC);
CREATE INDEX "Asset_favorite_archived_importedAt_idx" ON "Asset"("favorite", "archived", "importedAt" DESC);
CREATE INDEX "Asset_source_importedAt_idx" ON "Asset"("source", "importedAt" DESC);
CREATE INDEX "Asset_extension_importedAt_idx" ON "Asset"("extension", "importedAt" DESC);
CREATE INDEX "Asset_width_height_idx" ON "Asset"("width", "height");
CREATE INDEX "Asset_durationMs_idx" ON "Asset"("durationMs");
CREATE INDEX "Asset_fileSizeBytes_idx" ON "Asset"("fileSizeBytes");
CREATE INDEX "Asset_capturedAt_idx" ON "Asset"("capturedAt");
CREATE INDEX "AssetTag_tagId_idx" ON "AssetTag"("tagId");
CREATE INDEX "CollectionAsset_assetId_idx" ON "CollectionAsset"("assetId");
CREATE VIRTUAL TABLE "asset_fts" USING fts5(assetId UNINDEXED, filename, displayName, promptText, source, tags, searchableText, tokenize='porter unicode61');
PRAGMA foreign_keys=ON;
