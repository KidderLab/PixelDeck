import path from "node:path";
import { db } from "@/lib/db";

function arg(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const folder = arg("folder");
  const source = arg("source") ?? "manual-import";
  if (!folder) throw new Error("Usage: pnpm import:folder -- --folder <path> --source <name>");
  const job = await db.importJob.create({ data: { sourceFolder: path.resolve(folder), source } });
  console.log(`Created import job ${job.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await db.$disconnect();
});
