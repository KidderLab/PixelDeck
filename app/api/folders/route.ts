import { db } from "@/lib/db";
import { ok, fail } from "@/lib/server/api";

export async function GET() {
  try {
    const assets = await db.asset.findMany({
      where: { deletedAt: null },
      select: { folderPath: true, importedAt: true, id: true },
      orderBy: { importedAt: "desc" }
    });

    const grouped = new Map<string, { folderPath: string; count: number; latestImportedAt: Date; sampleAssetId: string }>();
    for (const asset of assets) {
      const key = asset.folderPath ?? "Uncategorized";
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, { folderPath: key, count: 1, latestImportedAt: asset.importedAt, sampleAssetId: asset.id });
      } else {
        existing.count += 1;
        if (asset.importedAt > existing.latestImportedAt) {
          existing.latestImportedAt = asset.importedAt;
          existing.sampleAssetId = asset.id;
        }
      }
    }

    return ok(Array.from(grouped.values()).sort((a, b) => b.latestImportedAt.getTime() - a.latestImportedAt.getTime()));
  } catch (error) {
    return fail(error, 500);
  }
}