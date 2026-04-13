import { db } from "@/lib/db";
import { ok, fail, parseJson } from "@/lib/server/api";
import { z } from "zod";

const savedSearchSchema = z.object({ name: z.string().min(1), queryJson: z.record(z.any()) });

export async function GET() {
  try {
    return ok(await db.savedSearch.findMany({ orderBy: { updatedAt: "desc" } }));
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, savedSearchSchema);
    return ok(await db.savedSearch.upsert({ where: { name: input.name }, update: { queryJson: input.queryJson }, create: input }));
  } catch (error) {
    return fail(error);
  }
}
