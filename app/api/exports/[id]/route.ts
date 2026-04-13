import { db } from "@/lib/db";
import { ok, fail } from "@/lib/server/api";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const job = await db.exportJob.findUnique({ where: { id } });
    if (!job) return fail(new Error("Export job not found"), 404);
    return ok(job);
  } catch (error) {
    return fail(error, 500);
  }
}