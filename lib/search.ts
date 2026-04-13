import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

function escapeLike(value: string) {
  return value.replace(/([%_\\])/g, "\\$1");
}

function buildFtsQuery(query: string) {
  const terms = query
    .trim()
    .split(/\s+/)
    .map((term) => term.replace(/["']/g, "").trim())
    .filter(Boolean);

  if (terms.length === 0) return null;
  return terms.map((term) => `${term}*`).join(" AND ");
}

export async function runAssetSearch(query?: string): Promise<string[] | null> {
  if (!query?.trim()) return null;

  const trimmed = query.trim();
  const loweredLike = `%${escapeLike(trimmed.toLowerCase())}%`;
  const ftsQuery = buildFtsQuery(trimmed);

  const rows = ftsQuery
    ? await db.$queryRaw<Array<{ assetId: string }>>(Prisma.sql`
        SELECT DISTINCT assetId
        FROM (
          SELECT assetId FROM asset_fts WHERE asset_fts MATCH ${ftsQuery}
          UNION
          SELECT assetId FROM asset_fts
          WHERE lower(filename) LIKE ${loweredLike} ESCAPE '\\'
             OR lower(displayName) LIKE ${loweredLike} ESCAPE '\\'
             OR lower(promptText) LIKE ${loweredLike} ESCAPE '\\'
             OR lower(source) LIKE ${loweredLike} ESCAPE '\\'
             OR lower(tags) LIKE ${loweredLike} ESCAPE '\\'
             OR lower(searchableText) LIKE ${loweredLike} ESCAPE '\\'
        )
        LIMIT 5000
      `)
    : await db.$queryRaw<Array<{ assetId: string }>>(Prisma.sql`
        SELECT DISTINCT assetId FROM asset_fts
        WHERE lower(filename) LIKE ${loweredLike} ESCAPE '\\'
           OR lower(displayName) LIKE ${loweredLike} ESCAPE '\\'
           OR lower(promptText) LIKE ${loweredLike} ESCAPE '\\'
           OR lower(source) LIKE ${loweredLike} ESCAPE '\\'
           OR lower(tags) LIKE ${loweredLike} ESCAPE '\\'
           OR lower(searchableText) LIKE ${loweredLike} ESCAPE '\\'
        LIMIT 5000
      `);

  return rows.map((row) => row.assetId);
}

export async function syncAssetSearchIndex(assetId: string) {
  const asset = await db.asset.findUnique({
    where: { id: assetId },
    include: { tags: { include: { tag: true } } }
  });
  if (!asset) return;
  const tags = asset.tags.map((item) => item.tag.name).join(" ");
  await db.$executeRawUnsafe("DELETE FROM asset_fts WHERE assetId = ?", asset.id);
  await db.$executeRawUnsafe(
    "INSERT INTO asset_fts(assetId, filename, displayName, promptText, source, tags, searchableText) VALUES (?, ?, ?, ?, ?, ?, ?)",
    asset.id,
    asset.originalFilename,
    asset.displayName,
    asset.promptText ?? "",
    asset.source,
    tags,
    asset.searchableText
  );
}

export async function rebuildSearchIndex() {
  await db.$executeRawUnsafe("DELETE FROM asset_fts");
  const assets = await db.asset.findMany({ include: { tags: { include: { tag: true } } } });
  for (const asset of assets) {
    const tags = asset.tags.map((item) => item.tag.name).join(" ");
    await db.$executeRawUnsafe(
      "INSERT INTO asset_fts(assetId, filename, displayName, promptText, source, tags, searchableText) VALUES (?, ?, ?, ?, ?, ?, ?)",
      asset.id,
      asset.originalFilename,
      asset.displayName,
      asset.promptText ?? "",
      asset.source,
      tags,
      asset.searchableText
    );
  }
}
