import fs from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { generateImagePreview, generateImageThumb, generateVideoPoster, getMediaTypeByExtension } from "@/lib/media";

async function main() {
  const assets = await db.asset.findMany();
  for (const asset of assets) {
    const extension = path.extname(asset.originalPath);
    const baseName = path.basename(asset.originalPath, extension);
    const thumbPath = path.join(config.paths.thumbs, `${baseName}.jpg`);
    const previewPath = path.join(config.paths.previews, `${baseName}.${asset.mediaType === "VIDEO" ? "mp4" : "jpg"}`);
    await fs.mkdir(path.dirname(thumbPath), { recursive: true });
    await fs.mkdir(path.dirname(previewPath), { recursive: true });
    if (asset.mediaType === "IMAGE") {
      await generateImageThumb(asset.originalPath, thumbPath);
      await generateImagePreview(asset.originalPath, previewPath);
    } else if (getMediaTypeByExtension(asset.originalPath) === "VIDEO") {
      const posterPath = path.join(config.paths.posters, `${baseName}.jpg`);
      await generateVideoPoster(asset.originalPath, posterPath);
    }
    await db.asset.update({ where: { id: asset.id }, data: { thumbnailPath: thumbPath, previewPath } });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await db.$disconnect();
});
