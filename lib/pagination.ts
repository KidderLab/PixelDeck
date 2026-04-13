export function decodeCursor(cursor?: string) {
  if (!cursor) return null;
  const [importedAt, id] = Buffer.from(cursor, "base64url").toString("utf8").split("|");
  return { importedAt: new Date(importedAt), id };
}

export function encodeCursor(item: { importedAt: Date; id: string }) {
  return Buffer.from(`${item.importedAt.toISOString()}|${item.id}`).toString("base64url");
}
