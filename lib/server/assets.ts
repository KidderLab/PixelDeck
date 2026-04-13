import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { buildAssetOrderBy, buildAssetWhere } from "@/lib/filters";
import { decodeCursor, encodeCursor } from "@/lib/pagination";
import { runAssetSearch } from "@/lib/search";

export interface AssetListInput {
  cursor?: string;
  limit: number;
  q?: string;
  mediaType?: "IMAGE" | "VIDEO";
  source?: string;
  extension?: string;
  favorite?: boolean;
  archived?: boolean;
  orientation?: "portrait" | "landscape" | "square";
  sort: "newest" | "oldest" | "name" | "width" | "height" | "fileSize" | "duration" | "resolution";
}

export async function listAssets(input: AssetListInput) {
  const matchedIds = await runAssetSearch(input.q);
  if (matchedIds && matchedIds.length === 0) {
    return { items: [], nextCursor: null, total: 0 };
  }

  const where = buildAssetWhere(input);
  if (matchedIds) {
    where.id = { in: matchedIds };
  }

  const cursor = decodeCursor(input.cursor);
  const items = await db.asset.findMany({
    where,
    orderBy: buildAssetOrderBy(input.sort),
    take: input.limit + 1,
    ...(cursor ? { cursor: { id: cursor.id }, skip: 1 } : {}),
    include: {
      tags: { include: { tag: true } }
    }
  });

  const sliced = items.slice(0, input.limit);
  const nextCursor = items.length > input.limit ? encodeCursor({ importedAt: sliced.at(-1)!.importedAt, id: sliced.at(-1)!.id }) : null;
  const total = await db.asset.count({ where });
  return { items: sliced, nextCursor, total };
}

export async function getAssetDetail(id: string) {
  return db.asset.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      collections: { include: { collection: true } }
    }
  });
}

export async function applyBulkAction(input: { assetIds: string[]; action: string; tagNames?: string[] }) {
  if (input.action === "favorite") return db.asset.updateMany({ where: { id: { in: input.assetIds } }, data: { favorite: true } });
  if (input.action === "unfavorite") return db.asset.updateMany({ where: { id: { in: input.assetIds } }, data: { favorite: false } });
  if (input.action === "archive") return db.asset.updateMany({ where: { id: { in: input.assetIds } }, data: { archived: true } });
  if (input.action === "unarchive") return db.asset.updateMany({ where: { id: { in: input.assetIds } }, data: { archived: false } });

  const tagNames = input.tagNames ?? [];
  const tags = await Promise.all(tagNames.map((name) => db.tag.upsert({ where: { name }, update: {}, create: { name } })));
  if (input.action === "tag-add") {
    for (const assetId of input.assetIds) {
      for (const tag of tags) {
        await db.assetTag.upsert({ where: { assetId_tagId: { assetId, tagId: tag.id } }, update: {}, create: { assetId, tagId: tag.id } });
      }
    }
  }
  if (input.action === "tag-remove") {
    await db.assetTag.deleteMany({ where: { assetId: { in: input.assetIds }, tagId: { in: tags.map((tag) => tag.id) } } });
  }
}

export async function getWorkerStatus() {
  const [pendingImports, runningImports, pendingExports, runningExports] = await Promise.all([
    db.importJob.count({ where: { status: "PENDING" } }),
    db.importJob.count({ where: { status: "RUNNING" } }),
    db.exportJob.count({ where: { status: "PENDING" } }),
    db.exportJob.count({ where: { status: "RUNNING" } })
  ]);

  return { pendingImports, runningImports, pendingExports, runningExports };
}
