import { z } from "zod";

export const assetListSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(60),
  q: z.string().optional(),
  mediaType: z.enum(["IMAGE", "VIDEO"]).optional(),
  source: z.string().optional(),
  extension: z.string().optional(),
  folderPath: z.string().optional(),
  favorite: z.coerce.boolean().optional(),
  archived: z.coerce.boolean().optional(),
  orientation: z.enum(["portrait", "landscape", "square"]).optional(),
  dateField: z.enum(["importedAt", "capturedAt", "generationDate"]).default("importedAt"),
  datePreset: z.enum(["all", "7d", "30d", "180d", "365d", "custom"]).default("all"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sort: z.enum(["newest", "oldest", "name", "width", "height", "fileSize", "duration", "resolution"]).default("newest")
});

export const bulkActionSchema = z.object({
  assetIds: z.array(z.string()).min(1),
  action: z.enum(["favorite", "unfavorite", "archive", "unarchive", "tag-add", "tag-remove"]),
  tagNames: z.array(z.string()).optional()
});

export const createImportJobSchema = z.object({
  sourceFolder: z.string().min(1),
  source: z.string().min(1)
});

export const createExportJobSchema = z.object({
  name: z.string().min(1),
  assetIds: z.array(z.string()).min(1)
});