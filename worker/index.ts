import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { processExportJob } from "@/worker/tasks/process-export-job";
import { processImportJob } from "@/worker/tasks/process-import-job";

async function claimNextImportJob() {
  const job = await db.importJob.findFirst({
    where: { status: { in: ["RUNNING", "PENDING"] } },
    orderBy: [
      { status: "asc" },
      { createdAt: "asc" }
    ]
  });

  if (job) await processImportJob(job.id);
}

async function claimNextExportJob() {
  const job = await db.exportJob.findFirst({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" } });
  if (job) await processExportJob(job.id);
}

async function tick() {
  await claimNextExportJob();
  await claimNextImportJob();
}

async function main() {
  logger.worker("Worker started");
  while (true) {
    await tick();
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

main().catch((error) => {
  logger.worker("Worker fatal error", { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
