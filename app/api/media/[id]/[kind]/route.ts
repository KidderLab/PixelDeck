import fs from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";

function getContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".webm") return "video/webm";
  if (ext === ".mov") return "video/quicktime";
  return "application/octet-stream";
}

export async function GET(_: Request, context: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await context.params;
  const asset = await db.asset.findUnique({ where: { id } });
  if (!asset) return new Response("Not found", { status: 404 });

  const filePath = kind === "thumb"
    ? asset.thumbnailPath
    : kind === "poster"
      ? (asset.posterPath ?? asset.thumbnailPath)
      : kind === "preview"
        ? asset.previewPath
        : asset.originalPath;

  if (!filePath) return new Response("Not found", { status: 404 });

  const buffer = await fs.readFile(path.resolve(filePath));
  return new Response(buffer, {
    headers: {
      "Content-Type": getContentType(filePath),
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
