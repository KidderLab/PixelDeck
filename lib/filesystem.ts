import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "@/lib/config";

export async function ensureStorageLayout() {
  await Promise.all(Object.values(config.paths).map((dir) => fs.mkdir(dir, { recursive: true })));
}

export async function copyOriginalToLibrary(sourcePath: string, extension: string) {
  const fileName = `${crypto.randomUUID()}${extension}`;
  const targetPath = path.join(config.paths.originals, fileName);
  await fs.copyFile(sourcePath, targetPath);
  return targetPath;
}

export async function listFilesRecursive(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const full = path.join(root, entry.name);
    return entry.isDirectory() ? listFilesRecursive(full) : [full];
  }));
  return nested.flat();
}
