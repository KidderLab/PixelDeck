import { NextRequest } from "next/server";
import { listAssets } from "@/lib/server/assets";
import { ok, fail } from "@/lib/server/api";
import { assetListSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = assetListSchema.parse(query);
    return ok(await listAssets(parsed));
  } catch (error) {
    return fail(error);
  }
}
