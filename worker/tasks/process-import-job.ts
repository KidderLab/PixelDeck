import fs from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { copyOriginalToLibrary, ensureStorageLayout, listFilesRecursive } from "@/lib/filesystem";
import { sha256File } from "@/lib/hash";
import { logger } from "@/lib/logger";
import { extractMediaMetadata, generateImagePreview, generateImageThumb, generateVideoPoster, generateVideoPreview, getMediaTypeByExtension } from "@/lib/media";
import { syncAssetSearchIndex } from "@/lib/search";
import { config } from "@/lib/config";

const IMPORT_BATCH_SIZE = 25;

function normalizeFolderContext(rootFolder: string, filePath: string) {
  const relativeDir = path.relative(rootFolder, path.dirname(filePath));
  if (!relativeDir || relativeDir === ".") return path.basename(rootFolder);
  return relativeDir.split(path.sep).filter(Boolean).join(" / ");
}

async function readImportJobStatus(jobId: string) {
  const job = await db.importJob.findUnique({
    where: { id: jobId },
    select: { status: true }
  });
  return job?.status ?? null;
}

export async function processImportJob(jobId: string) {
  const job = await db.importJob.findUnique({ where: { id: jobId } });
  if (!job) return;
  if (job.status === "CANCELLED" || job.status === "COMPLETED" || job.status === "FAILED") return;

  await ensureStorageLayout();
  const claimResult = await db.importJob.updateMany({
    where: {
      id: jobId,
      status: { in: ["PENDING", "RUNNING"] }
    },
    data: { status: "RUNNING" }
  });
  if (claimResult.count === 0) return;

  try {
    const files = await listFilesRecursive(job.sourceFolder);
    const totalDiscovered = files.length;
    const processedSoFar = job.processedCount;
    const nextFiles = files.slice(processedSoFar, processedSoFar + IMPORT_BATCH_SIZE);

    await db.importJob.update({
      where: { id: jobId },
      data: {
        totalDiscovered,
        status: nextFiles.length === 0 && processedSoFar >= totalDiscovered ? "COMPLETED" : "RUNNING"
      }
    });

    if (nextFiles.length === 0) {
      return;
    }

    for (const filePath of nextFiles) {
      const currentStatus = await readImportJobStatus(jobId);
      if (currentStatus === "CANCELLED") {
        logger.worker("Import job cancelled", { jobId });
        return;
      }

      const mediaType = getMediaTypeByExtension(filePath);
      if (!mediaType) {
        await db.importJob.update({ where: { id: jobId }, data: { skippedCount: { increment: 1 }, processedCount: { increment: 1 }, lastProcessedAt: new Date() } });
        continue;
      }

      try {
        const sourceStat = await fs.stat(filePath);
        const sha256 = await sha256File(filePath);
        const folderContext = normalizeFolderContext(job.sourceFolder, filePath);
        const duplicate = await db.asset.findUnique({ where: { sha256 } });
        if (duplicate) {
          await db.importDuplicateEvent.create({
            data: {
              importJobId: jobId,
              attemptedFilename: path.basename(filePath),
              attemptedPath: path.relative(job.sourceFolder, filePath),
              existingAssetId: duplicate.id,
              existingSha256: duplicate.sha256,
              existingDisplayName: duplicate.displayName,
              existingOriginalFilename: duplicate.originalFilename
            }
          });
          await db.importJob.update({ where: { id: jobId }, data: { duplicateCount: { increment: 1 }, processedCount: { increment: 1 }, lastProcessedAt: new Date() } });
          continue;
        }

        const extension = path.extname(filePath).toLowerCase();
        const originalFilename = path.basename(filePath);
        const imageName = path.basename(filePath, extension);
        const displayName = `${folderContext} - ${imageName}`;
        const originalPath = await copyOriginalToLibrary(filePath, extension);
        const metadata = await extractMediaMetadata(originalPath);
        const baseName = path.basename(originalPath, extension);
        const thumbPath = path.join(config.paths.thumbs, `${baseName}.jpg`);
        const previewPath = path.join(config.paths.previews, `${baseName}.${mediaType === "VIDEO" ? "mp4" : "jpg"}`);
        const posterPath = mediaType === "VIDEO" ? path.join(config.paths.posters, `${baseName}.jpg`) : null;

        await fs.mkdir(path.dirname(thumbPath), { recursive: true });
        await fs.mkdir(path.dirname(previewPath), { recursive: true });
        if (posterPath) await fs.mkdir(path.dirname(posterPath), { recursive: true });

        if (mediaType === "IMAGE") {
          await generateImageThumb(originalPath, thumbPath);
          await generateImagePreview(originalPath, previewPath);
        } else {
          await generateVideoPoster(originalPath, posterPath!);
          await generateVideoPreview(originalPath, previewPath);
          await generateImageThumb(posterPath!, thumbPath);
        }

        const width = metadata.width ?? null;
        const height = metadata.height ?? null;
        const aspectRatio = width && height ? Number((width / height).toFixed(4)) : null;
        const orientation = width && height ? width === height ? "square" : width > height ? "landscape" : "portrait" : null;
        const stat = await fs.stat(originalPath);
        const capturedAt = sourceStat.birthtime instanceof Date && !Number.isNaN(sourceStat.birthtime.getTime()) ? sourceStat.birthtime : sourceStat.mtime;
        const searchableText = [folderContext, originalFilename, imageName, displayName, job.source].join(" ").trim();

        const asset = await db.asset.create({
          data: {
            originalFilename,
            displayName,
            folderPath: folderContext,
            mediaType,
            mimeType: metadata.mimeType,
            extension,
            width,
            height,
            durationMs: metadata.durationMs ?? null,
            aspectRatio,
            orientation,
            fileSizeBytes: BigInt(stat.size),
            sha256,
            originalPath,
            thumbnailPath: thumbPath,
            previewPath,
            posterPath,
            source: job.source,
            importedAt: new Date(),
            capturedAt,
            metadataJson: metadata.metadataJson ?? {},
            searchableText
          }
        });

        await syncAssetSearchIndex(asset.id);
        await db.importJob.update({ where: { id: jobId }, data: { processedCount: { increment: 1 }, lastProcessedAt: new Date() } });
      } catch (error) {
        logger.worker("Import file failed", { filePath, error: error instanceof Error ? error.message : String(error) });
        await db.importJob.update({ where: { id: jobId }, data: { failedCount: { increment: 1 }, processedCount: { increment: 1 }, lastProcessedAt: new Date() } });
      }
    }

    const refreshed = await db.importJob.findUnique({ where: { id: jobId } });
    if (!refreshed) return;
    if (refreshed.status === "CANCELLED") return;

    const finished = refreshed.processedCount >= totalDiscovered;
    await db.importJob.update({
      where: { id: jobId },
      data: { status: finished ? "COMPLETED" : "PENDING" }
    });
  } catch (error) {
    await db.importJob.update({ where: { id: jobId }, data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : String(error) } });
    logger.worker("Import job failed", { jobId, error: error instanceof Error ? error.message : String(error) });
  }
}
