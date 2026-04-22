import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { db } from "@/lib/db";

type Pixel = [number, number, number];
type LineKind = "diag_main" | "diag_anti" | "mid_horizontal" | "mid_vertical";

type Point = {
  x: number;
  y: number;
};

type ChannelStats = {
  mean: number;
  std: number;
  min: number;
  max: number;
  p25: number;
  median: number;
  p75: number;
};

type LineSummary = {
  line: LineKind;
  red: ChannelStats;
  green: ChannelStats;
  blue: ChannelStats;
  intensity: ChannelStats;
  gradientMean: number;
  gradientStd: number;
};

type FeatureRow = Record<string, string | number | null>;

function arg(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function usage() {
  return [
    "Usage: pnpm analyze:rgb-lines -- --source <label1,label2,...> [--out <folder>] [--sample-points 256] [--limit 0] [--write-overlays] [--overlay-limit 24]",
    "",
    "Examples:",
    '  pnpm analyze:rgb-lines -- --source "panoptils-bootstrap-rgbs,panoptils-manual-rgbs"',
    '  pnpm analyze:rgb-lines -- --source "panoptils-bootstrap-rgbs" --out ".\\\\analysis\\\\rgb-lines" --write-overlays'
  ].join("\n");
}

function round(value: number, places = 6) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function quantile(values: number[], q: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  const weight = position - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function describe(values: number[]): ChannelStats {
  if (values.length === 0) {
    return { mean: 0, std: 0, min: 0, max: 0, p25: 0, median: 0, p75: 0 };
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
  return {
    mean: round(mean),
    std: round(Math.sqrt(variance)),
    min: round(Math.min(...values)),
    max: round(Math.max(...values)),
    p25: round(quantile(values, 0.25)),
    median: round(quantile(values, 0.5)),
    p75: round(quantile(values, 0.75))
  };
}

function parseSources() {
  const sourceArg = arg("source");
  if (!sourceArg) throw new Error(usage());
  return sourceArg.split(",").map((value) => value.trim()).filter(Boolean);
}

function interpolatePoint(start: Point, end: Point, t: number): Point {
  return {
    x: Math.round(start.x + ((end.x - start.x) * t)),
    y: Math.round(start.y + ((end.y - start.y) * t))
  };
}

function buildLinePoints(width: number, height: number, samplePoints: number): Record<LineKind, Point[]> {
  const safeCount = Math.max(2, samplePoints);
  const midX = Math.round((width - 1) / 2);
  const midY = Math.round((height - 1) / 2);
  const lines: Record<LineKind, [Point, Point]> = {
    diag_main: [{ x: 0, y: 0 }, { x: width - 1, y: height - 1 }],
    diag_anti: [{ x: width - 1, y: 0 }, { x: 0, y: height - 1 }],
    mid_horizontal: [{ x: 0, y: midY }, { x: width - 1, y: midY }],
    mid_vertical: [{ x: midX, y: 0 }, { x: midX, y: height - 1 }]
  };

  return Object.fromEntries(
    Object.entries(lines).map(([key, [start, end]]) => {
      const points = Array.from({ length: safeCount }, (_, index) => interpolatePoint(start, end, index / (safeCount - 1)));
      return [key, points];
    })
  ) as Record<LineKind, Point[]>;
}

function readPixel(data: Buffer, width: number, point: Point): Pixel {
  const x = Math.max(0, Math.min(width - 1, point.x));
  const y = Math.max(0, point.y);
  const offset = ((y * width) + x) * 3;
  return [data[offset], data[offset + 1], data[offset + 2]];
}

function summarizeLine(line: LineKind, pixels: Pixel[]): LineSummary {
  const red = pixels.map((pixel) => pixel[0] / 255);
  const green = pixels.map((pixel) => pixel[1] / 255);
  const blue = pixels.map((pixel) => pixel[2] / 255);
  const intensity = pixels.map((pixel) => (pixel[0] + pixel[1] + pixel[2]) / (3 * 255));
  const gradients = intensity.slice(1).map((value, index) => Math.abs(value - intensity[index]));

  return {
    line,
    red: describe(red),
    green: describe(green),
    blue: describe(blue),
    intensity: describe(intensity),
    gradientMean: round(gradients.reduce((sum, value) => sum + value, 0) / Math.max(1, gradients.length)),
    gradientStd: describe(gradients).std
  };
}

function flattenSummary(prefix: string, summary: ChannelStats, row: FeatureRow) {
  row[`${prefix}_mean`] = summary.mean;
  row[`${prefix}_std`] = summary.std;
  row[`${prefix}_min`] = summary.min;
  row[`${prefix}_max`] = summary.max;
  row[`${prefix}_p25`] = summary.p25;
  row[`${prefix}_median`] = summary.median;
  row[`${prefix}_p75`] = summary.p75;
}

function featureRowFromSummaries(base: FeatureRow, summaries: LineSummary[]) {
  const row = { ...base };
  for (const summary of summaries) {
    flattenSummary(`${summary.line}_red`, summary.red, row);
    flattenSummary(`${summary.line}_green`, summary.green, row);
    flattenSummary(`${summary.line}_blue`, summary.blue, row);
    flattenSummary(`${summary.line}_intensity`, summary.intensity, row);
    row[`${summary.line}_gradient_mean`] = summary.gradientMean;
    row[`${summary.line}_gradient_std`] = summary.gradientStd;
  }
  return row;
}

function toCsv(rows: FeatureRow[]) {
  if (rows.length === 0) return "";
  const headers = Array.from(rows.reduce((set, row) => {
    for (const key of Object.keys(row)) set.add(key);
    return set;
  }, new Set<string>()));

  const encode = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return "";
    const text = String(value);
    if (text.includes(",") || text.includes('"') || text.includes("\n")) {
      return `"${text.replaceAll('"', '""')}"`;
    }
    return text;
  };

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => encode(row[header] as string | number | null | undefined)).join(","))
  ].join("\n");
}

function summarizeGroup(rows: FeatureRow[], keys: string[]) {
  if (rows.length === 0) return null;

  const summary: FeatureRow = {};
  for (const key of keys) {
    summary[key] = rows[0]?.[key] ?? "";
  }

  summary.image_count = rows.length;

  const numericKeys = Array.from(
    rows.reduce((set, row) => {
      for (const [key, value] of Object.entries(row)) {
        if (keys.includes(key)) continue;
        if (typeof value === "number" && Number.isFinite(value)) {
          set.add(key);
        }
      }
      return set;
    }, new Set<string>())
  );

  for (const key of numericKeys) {
    const values = rows.map((row) => row[key]).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    if (values.length === 0) continue;
    summary[`${key}_mean`] = round(values.reduce((sum, value) => sum + value, 0) / values.length);
    summary[`${key}_std`] = describe(values).std;
    summary[`${key}_min`] = round(Math.min(...values));
    summary[`${key}_max`] = round(Math.max(...values));
    summary[`${key}_median`] = round(quantile(values, 0.5));
  }

  return summary;
}

async function writeOverlay({
  inputPath,
  outputPath,
  width,
  height
}: {
  inputPath: string;
  outputPath: string;
  width: number;
  height: number;
}) {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="0" x2="${width - 1}" y2="${height - 1}" stroke="#ef4444" stroke-width="${Math.max(2, Math.round(width / 256))}" />
      <line x1="${width - 1}" y1="0" x2="0" y2="${height - 1}" stroke="#22c55e" stroke-width="${Math.max(2, Math.round(width / 256))}" />
      <line x1="0" y1="${Math.round((height - 1) / 2)}" x2="${width - 1}" y2="${Math.round((height - 1) / 2)}" stroke="#3b82f6" stroke-width="${Math.max(2, Math.round(height / 256))}" />
      <line x1="${Math.round((width - 1) / 2)}" y1="0" x2="${Math.round((width - 1) / 2)}" y2="${height - 1}" stroke="#f59e0b" stroke-width="${Math.max(2, Math.round(width / 256))}" />
    </svg>
  `;

  await sharp(inputPath)
    .composite([{ input: Buffer.from(svg), blend: "over" }])
    .png()
    .toFile(outputPath);
}

async function main() {
  const sources = parseSources();
  const samplePoints = Number(arg("sample-points") ?? "256");
  const limit = Number(arg("limit") ?? "0");
  const outDir = path.resolve(arg("out") ?? path.join("analysis", "rgb-lines"));
  const writeOverlays = hasFlag("write-overlays");
  const overlayLimit = Number(arg("overlay-limit") ?? "24");

  await fs.mkdir(outDir, { recursive: true });
  if (writeOverlays) {
    await fs.mkdir(path.join(outDir, "overlays"), { recursive: true });
  }

  const assets = await db.asset.findMany({
    where: {
      source: { in: sources },
      mediaType: "IMAGE",
      deletedAt: null
    },
    orderBy: [{ source: "asc" }, { importedAt: "asc" }],
    select: {
      id: true,
      source: true,
      originalFilename: true,
      displayName: true,
      folderPath: true,
      originalPath: true,
      importedAt: true
    }
  });

  const selectedAssets = limit > 0 ? assets.slice(0, limit) : assets;
  const rows: FeatureRow[] = [];
  let overlayCount = 0;

  for (const asset of selectedAssets) {
    const { data, info } = await sharp(asset.originalPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const linePoints = buildLinePoints(info.width, info.height, samplePoints);
    const summaries = (Object.entries(linePoints) as [LineKind, Point[]][]).map(([line, points]) => {
      const pixels = points.map((point) => readPixel(data, info.width, point));
      return summarizeLine(line, pixels);
    });

    rows.push(featureRowFromSummaries({
      asset_id: asset.id,
      source: asset.source,
      folder_path: asset.folderPath ?? "",
      original_filename: asset.originalFilename,
      display_name: asset.displayName,
      width: info.width,
      height: info.height,
      imported_at: asset.importedAt.toISOString()
    }, summaries));

    if (writeOverlays && overlayCount < overlayLimit) {
      const overlayName = `${asset.source}-${asset.id}.png`.replace(/[^a-zA-Z0-9._-]+/g, "_");
      await writeOverlay({
        inputPath: asset.originalPath,
        outputPath: path.join(outDir, "overlays", overlayName),
        width: info.width,
        height: info.height
      });
      overlayCount += 1;
    }
  }

  const csvPath = path.join(outDir, "rgb_line_features.csv");
  const folderSummaryPath = path.join(outDir, "rgb_line_folder_summary.csv");
  const sourceSummaryPath = path.join(outDir, "rgb_line_source_summary.csv");
  const jsonPath = path.join(outDir, "rgb_line_manifest.json");

  const folderGroups = new Map<string, FeatureRow[]>();
  const sourceGroups = new Map<string, FeatureRow[]>();

  for (const row of rows) {
    const folderKey = `${row.source}__${row.folder_path}`;
    folderGroups.set(folderKey, [...(folderGroups.get(folderKey) ?? []), row]);

    const sourceKey = String(row.source);
    sourceGroups.set(sourceKey, [...(sourceGroups.get(sourceKey) ?? []), row]);
  }

  const folderSummaries = Array.from(folderGroups.values())
    .map((groupRows) => summarizeGroup(groupRows, ["source", "folder_path"]))
    .filter((row): row is FeatureRow => row !== null);

  const sourceSummaries = Array.from(sourceGroups.values())
    .map((groupRows) => summarizeGroup(groupRows, ["source"]))
    .filter((row): row is FeatureRow => row !== null);

  await fs.writeFile(csvPath, toCsv(rows), "utf8");
  await fs.writeFile(folderSummaryPath, toCsv(folderSummaries), "utf8");
  await fs.writeFile(sourceSummaryPath, toCsv(sourceSummaries), "utf8");
  await fs.writeFile(jsonPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    sources,
    samplePoints,
    analyzedImages: rows.length,
    folderSummaries: folderSummaries.length,
    sourceSummaries: sourceSummaries.length,
    overlayImagesWritten: overlayCount,
    featureColumns: rows.length ? Object.keys(rows[0]) : []
  }, null, 2), "utf8");

  console.log(`Wrote ${rows.length} image feature rows to ${csvPath}`);
  console.log(`Wrote ${folderSummaries.length} folder summaries to ${folderSummaryPath}`);
  console.log(`Wrote ${sourceSummaries.length} source summaries to ${sourceSummaryPath}`);
  console.log(`Wrote manifest to ${jsonPath}`);
  if (writeOverlays) {
    console.log(`Overlay previews written to ${path.join(outDir, "overlays")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await db.$disconnect();
});
