import { db } from "@/lib/db";
import { ok, fail, parseJson } from "@/lib/server/api";
import { createExportJobSchema } from "@/lib/validation";

export async function GET() {
  try {
    return ok(await db.exportJob.findMany({ orderBy: { createdAt: "desc" }, take: 50 }));
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, createExportJobSchema);
    const job = await db.exportJob.create({ data: { name: input.name, assetIdsJson: input.assetIds, totalCount: input.assetIds.length } });
    return ok(job, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
