import fs from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = await db.exportJob.findUnique({ where: { id } });
  if (!job || !job.zipPath) return new Response("Not found", { status: 404 });
  const buffer = await fs.readFile(job.zipPath);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${path.basename(job.zipPath)}"`
    }
  });
}