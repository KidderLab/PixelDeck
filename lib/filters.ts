interface AssetListInput {
  cursor?: string;
  limit: number;
  q?: string;
  mediaType?: "IMAGE" | "VIDEO";
  source?: string;
  extension?: string;
  folderPath?: string;
  favorite?: boolean;
  archived?: boolean;
  orientation?: "portrait" | "landscape" | "square";
  dateField?: "importedAt" | "capturedAt" | "generationDate";
  datePreset?: "all" | "7d" | "30d" | "180d" | "365d" | "custom";
  startDate?: string;
  endDate?: string;
  sort: "newest" | "oldest" | "name" | "width" | "height" | "fileSize" | "duration" | "resolution";
}

function buildDateRange(input: AssetListInput) {
  const now = Date.now();
  let start: Date | null = null;
  let end: Date | null = null;

  switch (input.datePreset) {
    case "7d":
      start = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      start = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    case "180d":
      start = new Date(now - 180 * 24 * 60 * 60 * 1000);
      break;
    case "365d":
      start = new Date(now - 365 * 24 * 60 * 60 * 1000);
      break;
    case "custom":
      start = input.startDate ? new Date(`${input.startDate}T00:00:00.000Z`) : null;
      end = input.endDate ? new Date(`${input.endDate}T23:59:59.999Z`) : null;
      break;
    default:
      break;
  }

  if (!start && input.startDate) start = new Date(`${input.startDate}T00:00:00.000Z`);
  if (!end && input.endDate) end = new Date(`${input.endDate}T23:59:59.999Z`);
  if (!start && !end) return null;

  const range: Record<string, Date> = {};
  if (start) range.gte = start;
  if (end) range.lte = end;
  return range;
}

export function buildAssetWhere(input: AssetListInput) {
  const where: Record<string, unknown> = { deletedAt: null };
  if (input.mediaType) where.mediaType = input.mediaType;
  if (input.source) where.source = input.source;
  if (input.extension) where.extension = input.extension.toLowerCase();
  if (input.folderPath) where.folderPath = input.folderPath;
  if (typeof input.favorite === "boolean") where.favorite = input.favorite;
  if (typeof input.archived === "boolean") where.archived = input.archived;
  if (input.orientation) where.orientation = input.orientation;

  const dateRange = buildDateRange(input);
  if (dateRange) where[input.dateField ?? "importedAt"] = dateRange;

  return where;
}

export function buildAssetOrderBy(sort: AssetListInput["sort"]) {
  switch (sort) {
    case "oldest":
      return [{ importedAt: "asc" }, { id: "asc" }];
    case "name":
      return [{ displayName: "asc" }, { id: "desc" }];
    case "width":
      return [{ width: "desc" }, { importedAt: "desc" }];
    case "height":
      return [{ height: "desc" }, { importedAt: "desc" }];
    case "fileSize":
      return [{ fileSizeBytes: "desc" }, { importedAt: "desc" }];
    case "duration":
      return [{ durationMs: "desc" }, { importedAt: "desc" }];
    case "resolution":
      return [{ width: "desc" }, { height: "desc" }, { importedAt: "desc" }];
    case "newest":
    default:
      return [{ importedAt: "desc" }, { id: "desc" }];
  }
}