import path from "node:path";
import { db } from "@/lib/db";
import { createZipArchive } from "@/lib/zip";
import { logger } from "@/lib/logger";

function makeUniqueNames(names: string[]) {
  const counts = new Map<string, number>();
  return names.map((name) => {
    const parsed = path.parse(name);
    const seen = counts.get(name) ?? 0;
    counts.set(name, seen + 1);
    if (seen === 0) return name;
    return `${parsed.name} (${seen + 1})${parsed.ext}`;
  });
}

export async function processExportJob(jobId: string) {
  const job = await db.exportJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  await db.exportJob.update({ where: { id: jobId }, data: { status: "RUNNING" } });
  try {
    const assetIds = job.assetIdsJson as string[];
    const assets = await db.asset.findMany({ where: { id: { in: assetIds } } });
    const zipNames = makeUniqueNames(assets.map((asset) => asset.originalFilename));
    const zipPath = await createZipArchive(job.name, assets.map((asset, index) => ({ sourcePath: asset.originalPath, name: zipNames[index] })));
    await db.exportJob.update({ where: { id: jobId }, data: { status: "COMPLETED", progressCount: assets.length, totalCount: assets.length, zipPath } });
  } catch (error) {
    logger.worker("Export job failed", { jobId, error: error instanceof Error ? error.message : String(error) });
    await db.exportJob.update({ where: { id: jobId }, data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : String(error) } });
  }
}