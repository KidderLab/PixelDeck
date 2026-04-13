import { db } from "@/lib/db";
import { ok, fail, parseJson } from "@/lib/server/api";
import { z } from "zod";

const collectionSchema = z.object({ name: z.string().min(1), description: z.string().optional(), assetIds: z.array(z.string()).optional() });

export async function GET() {
  try {
    return ok(await db.collection.findMany({ include: { _count: { select: { assets: true } } }, orderBy: { updatedAt: "desc" } }));
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, collectionSchema);
    const collection = await db.collection.create({ data: { name: input.name, description: input.description } });
    if (input.assetIds?.length) {
      await db.collectionAsset.createMany({ data: input.assetIds.map((assetId) => ({ collectionId: collection.id, assetId })), skipDuplicates: true });
    }
    return ok(collection, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
