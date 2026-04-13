import path from "node:path";
import sharp from "sharp";
import { config } from "@/lib/config";
import { runFfmpeg } from "@/lib/ffmpeg";
import { runFfprobe } from "@/lib/ffprobe";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".webm", ".mkv"]);

export function getMediaTypeByExtension(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return "IMAGE" as const;
  if (VIDEO_EXTENSIONS.has(ext)) return "VIDEO" as const;
  return null;
}

export async function extractMediaMetadata(filePath: string) {
  const mediaType = getMediaTypeByExtension(filePath);
  if (!mediaType) throw new Error(`Unsupported media type for ${filePath}`);

  if (mediaType === "IMAGE") {
    const image = sharp(filePath);
    const metadata = await image.metadata();
    return {
      mediaType,
      mimeType: metadata.format ? `image/${metadata.format}` : "image/unknown",
      width: metadata.width,
      height: metadata.height,
      durationMs: undefined,
      metadataJson: metadata
    };
  }

  const probe = await runFfprobe(filePath);
  return {
    mediaType,
    mimeType: "video/mp4",
    width: probe.width,
    height: probe.height,
    durationMs: probe.durationMs,
    metadataJson: probe
  };
}

export async function generateImageThumb(sourcePath: string, targetPath: string) {
  await sharp(sourcePath).resize(config.PIXELDECK_THUMB_SIZE, config.PIXELDECK_THUMB_SIZE, { fit: "inside" }).jpeg({ quality: 80 }).toFile(targetPath);
}

export async function generateImagePreview(sourcePath: string, targetPath: string) {
  await sharp(sourcePath).resize(config.PIXELDECK_PREVIEW_SIZE, config.PIXELDECK_PREVIEW_SIZE, { fit: "inside" }).jpeg({ quality: 88 }).toFile(targetPath);
}

export async function generateVideoPoster(sourcePath: string, targetPath: string) {
  await runFfmpeg(["-y", "-i", sourcePath, "-ss", "00:00:01.000", "-vframes", "1", targetPath]);
}

export async function generateVideoPreview(sourcePath: string, targetPath: string) {
  await runFfmpeg(["-y", "-i", sourcePath, "-t", String(config.PIXELDECK_VIDEO_PREVIEW_SECONDS), "-vf", "scale=1280:-2", "-an", targetPath]);
}
