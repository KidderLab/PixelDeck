import { ok, fail } from "@/lib/server/api";
import { getAssetDetail } from "@/lib/server/assets";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const asset = await getAssetDetail(id);
    if (!asset) return fail(new Error("Asset not found"), 404);
    return ok(asset);
  } catch (error) {
    return fail(error, 500);
  }
}
