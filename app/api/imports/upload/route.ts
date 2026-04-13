import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { ensureStorageLayout } from "@/lib/filesystem";
import { fail, ok } from "@/lib/server/api";

function sanitizeRelativePath(relativePath: string) {
  return relativePath
    .split(/[\\/]+/)
    .filter(Boolean)
    .map((segment) => segment.replace(/[\\/:*?"<>|]/g, "_"))
    .join(path.sep);
}

export async function POST(request: Request) {
  try {
    await ensureStorageLayout();
    const formData = await request.formData();
    const source = String(formData.get("source") ?? "browser-upload");
    const entries = formData.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);

    if (!entries.length) {
      return fail(new Error("No files were uploaded"), 400);
    }

    const batchId = crypto.randomUUID();
    const stagingDir = path.join(config.paths.imports, batchId);
    await fs.mkdir(stagingDir, { recursive: true });

    for (const file of entries) {
      const relativePath = sanitizeRelativePath(file.webkitRelativePath || file.name);
      const targetPath = path.join(stagingDir, relativePath);
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(targetPath, buffer);
    }

    const job = await db.importJob.create({
      data: {
        sourceFolder: stagingDir,
        source
      }
    });

    return ok({ job, uploadedCount: entries.length }, { status: 201 });
  } catch (error) {
    return fail(error, 500);
  }
}