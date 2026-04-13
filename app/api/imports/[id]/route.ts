import { db } from "@/lib/db";
import { ok, fail } from "@/lib/server/api";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const job = await db.importJob.findUnique({
      where: { id },
      include: {
        duplicateEvents: {
          orderBy: { createdAt: "desc" },
          take: 100
        }
      }
    });
    if (!job) return fail(new Error("Import job not found"), 404);
    return ok(job);
  } catch (error) {
    return fail(error, 500);
  }
}