import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.appSetting.upsert({
    where: { key: "ui.preferences" },
    update: { valueJson: { theme: "dark", galleryColumns: 6, defaultSort: "newest" } },
    create: { key: "ui.preferences", valueJson: { theme: "dark", galleryColumns: 6, defaultSort: "newest" } }
  });

  for (const tag of [
    { name: "favorite-candidate", color: "#f59e0b" },
    { name: "midjourney", color: "#38bdf8" },
    { name: "cinematic", color: "#10b981" }
  ]) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: { color: tag.color },
      create: tag
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
