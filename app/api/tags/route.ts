import { db } from "@/lib/db";
import { ok, fail, parseJson } from "@/lib/server/api";
import { z } from "zod";

const createTagSchema = z.object({ name: z.string().min(1), color: z.string().optional() });

export async function GET() {
  try {
    return ok(await db.tag.findMany({ orderBy: { name: "asc" } }));
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, createTagSchema);
    return ok(await db.tag.upsert({ where: { name: input.name }, update: { color: input.color }, create: input }));
  } catch (error) {
    return fail(error);
  }
}
