import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { config } from "@/lib/config";

async function main() {
  await fs.mkdir(path.join(process.cwd(), "public", "sample-data"), { recursive: true });
  const colors = ["#0ea5e9", "#f97316", "#10b981", "#a855f7"];
  for (let index = 0; index < 12; index += 1) {
    const color = colors[index % colors.length];
    const filePath = path.join(process.cwd(), "public", "sample-data", `sample-${index + 1}.jpg`);
    await sharp({ create: { width: 1600, height: 1000 + (index % 3) * 220, channels: 3, background: color } }).jpeg({ quality: 90 }).toFile(filePath);
  }
  console.log("Sample images written to public/sample-data");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
