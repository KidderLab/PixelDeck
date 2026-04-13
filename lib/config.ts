import path from "node:path";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().default("file:./storage/db/pixeldeck.db"),
  PIXELDECK_STORAGE_ROOT: z.string().default("./storage"),
  PIXELDECK_IMPORT_ROOT: z.string().default("./storage/imports"),
  PIXELDECK_ORIGINALS_ROOT: z.string().default("./storage/originals"),
  PIXELDECK_THUMBS_ROOT: z.string().default("./storage/thumbs"),
  PIXELDECK_PREVIEWS_ROOT: z.string().default("./storage/previews"),
  PIXELDECK_POSTERS_ROOT: z.string().default("./storage/video-posters"),
  PIXELDECK_ZIPS_ROOT: z.string().default("./storage/zips"),
  PIXELDECK_LOG_ROOT: z.string().default("./storage/logs"),
  PIXELDECK_FFMPEG_PATH: z.string().default("ffmpeg"),
  PIXELDECK_FFPROBE_PATH: z.string().default("ffprobe"),
  PIXELDECK_THUMB_SIZE: z.coerce.number().default(420),
  PIXELDECK_PREVIEW_SIZE: z.coerce.number().default(1600),
  PIXELDECK_VIDEO_PREVIEW_SECONDS: z.coerce.number().default(6),
  PIXELDECK_IMPORT_CONCURRENCY: z.coerce.number().default(2)
});

const env = envSchema.parse(process.env);

export const config = {
  ...env,
  paths: {
    storageRoot: path.resolve(env.PIXELDECK_STORAGE_ROOT),
    imports: path.resolve(env.PIXELDECK_IMPORT_ROOT),
    originals: path.resolve(env.PIXELDECK_ORIGINALS_ROOT),
    thumbs: path.resolve(env.PIXELDECK_THUMBS_ROOT),
    previews: path.resolve(env.PIXELDECK_PREVIEWS_ROOT),
    posters: path.resolve(env.PIXELDECK_POSTERS_ROOT),
    zips: path.resolve(env.PIXELDECK_ZIPS_ROOT),
    logs: path.resolve(env.PIXELDECK_LOG_ROOT)
  }
};
