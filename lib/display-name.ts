export function getCleanAssetDisplayName(displayName: string, originalFilename?: string | null) {
  const fallback = (displayName || originalFilename || "Untitled").trim();
  if (!fallback) return "Untitled";

  const separator = " - ";
  const separatorIndex = fallback.indexOf(separator);
  const prefix = separatorIndex >= 0 ? fallback.slice(0, separatorIndex + separator.length) : "";
  let body = separatorIndex >= 0 ? fallback.slice(separatorIndex + separator.length) : fallback;

  body = body.replace(/\.[a-z0-9]{2,5}$/i, "");
  body = body.replace(/^https?s?\.[^_\s-]+[_-]+/i, "");
  body = body.replace(/^mj\.[^_\s-]+[_-]+/i, "");
  body = body.replace(/_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_\d+$/i, "");
  body = body.replace(/-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-\d+$/i, "");
  body = body.replace(/_[0-9a-f]{24,}$/i, "");
  body = body.replace(/\s+/g, " ").replace(/[_-]{2,}/g, "_").trim();

  if (!body) {
    const rawFallback = (originalFilename ?? fallback).replace(/\.[a-z0-9]{2,5}$/i, "").trim();
    return rawFallback || "Untitled";
  }

  return `${prefix}${body}`.trim();
}
