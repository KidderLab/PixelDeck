import { ok, fail, parseJson } from "@/lib/server/api";
import { applyBulkAction } from "@/lib/server/assets";
import { bulkActionSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, bulkActionSchema);
    await applyBulkAction(input);
    return ok({ updated: input.assetIds.length });
  } catch (error) {
    return fail(error);
  }
}
