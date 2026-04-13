import path from "node:path";
import { db } from "@/lib/db";
import { ok, fail, parseJson } from "@/lib/server/api";
import { getWorkerStatus } from "@/lib/server/assets";
import { config } from "@/lib/config";
import { z } from "zod";

const settingSchema = z.object({ key: z.string().min(1), valueJson: z.record(z.any()) });

function resolveDatabasePath() {
  if (config.DATABASE_URL.startsWith("file:")) {
    return path.resolve(config.DATABASE_URL.slice(5));
  }
  return config.DATABASE_URL;
}

export async function GET() {
  try {
    const [settings, worker] = await Promise.all([
      db.appSetting.findMany({ orderBy: { key: "asc" } }),
      getWorkerStatus()
    ]);
    return ok({
      settings,
      worker,
      storage: {
        database: resolveDatabasePath(),
        storageRoot: config.paths.storageRoot,
        imports: config.paths.imports,
        originals: config.paths.originals,
        thumbs: config.paths.thumbs,
        previews: config.paths.previews,
        posters: config.paths.posters,
        zips: config.paths.zips,
        logs: config.paths.logs
      }
    });
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, settingSchema);
    return ok(await db.appSetting.upsert({ where: { key: input.key }, update: { valueJson: input.valueJson }, create: input }));
  } catch (error) {
    return fail(error);
  }
}
