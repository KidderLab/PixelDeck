import { db } from "@/lib/db";
import { ok, fail, parseJson } from "@/lib/server/api";
import { createImportJobSchema } from "@/lib/validation";

export async function GET() {
  try {
    const jobs = await db.importJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        _count: { select: { duplicateEvents: true } },
        duplicateEvents: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            attemptedFilename: true,
            attemptedPath: true,
            existingAssetId: true,
            existingDisplayName: true,
            existingOriginalFilename: true,
            createdAt: true
          }
        }
      }
    });
    return ok(jobs);
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, createImportJobSchema);
    const job = await db.importJob.create({ data: input });
    return ok(job, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}