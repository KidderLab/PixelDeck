import { ok, fail } from "@/lib/server/api";
import { getWorkerStatus } from "@/lib/server/assets";

export async function GET() {
  try {
    return ok({ status: "ok", time: new Date().toISOString(), worker: await getWorkerStatus() });
  } catch (error) {
    return fail(error, 500);
  }
}
