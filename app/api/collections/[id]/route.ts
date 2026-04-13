import { db } from "@/lib/db";
import { ok, fail, parseJson } from "@/lib/server/api";
import { z } from "zod";

const updateCollectionSchema = z.object({ name: z.string().min(1).optional(), description: z.string().optional(), assetIds: z.array(z.string()).optional() });

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const collection = await db.collection.findUnique({ where: { id }, include: { assets: { include: { asset: true } } } });
    if (!collection) return fail(new Error("Collection not found"), 404);
    return ok(collection);
  } catch (error) {
    return fail(error, 500);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const input = await parseJson(request, updateCollectionSchema);
    const collection = await db.collection.update({ where: { id }, data: { name: input.name, description: input.description } });
    if (input.assetIds) {
      await db.collectionAsset.deleteMany({ where: { collectionId: id } });
      await db.collectionAsset.createMany({ data: input.assetIds.map((assetId) => ({ collectionId: id, assetId })), skipDuplicates: true });
    }
    return ok(collection);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await db.collection.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return fail(error);
  }
}
