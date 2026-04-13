import fs from "node:fs/promises";
import path from "node:path";
import { config } from "@/lib/config";

const crcTable = new Uint32Array(256).map((_, index) => {
  let c = index;
  for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  return c >>> 0;
});

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date) {
  const year = Math.max(1980, date.getFullYear()) - 1980;
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: (year << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  };
}

function u32(value: number) { const buffer = Buffer.alloc(4); buffer.writeUInt32LE(value >>> 0, 0); return buffer; }
function u16(value: number) { const buffer = Buffer.alloc(2); buffer.writeUInt16LE(value, 0); return buffer; }

export async function createZipArchive(fileName: string, assets: Array<{ sourcePath: string; name: string }>) {
  await fs.mkdir(config.paths.zips, { recursive: true });
  const outputPath = path.join(config.paths.zips, `${fileName}.zip`);
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const asset of assets) {
    const data = await fs.readFile(asset.sourcePath);
    const name = Buffer.from(asset.name);
    const stamp = dosDateTime(new Date());
    const crc = crc32(data);
    const localHeader = Buffer.concat([u32(0x04034b50), u16(20), u16(0), u16(0), u16(stamp.time), u16(stamp.date), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name]);
    localParts.push(localHeader, data);
    const centralHeader = Buffer.concat([u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(stamp.time), u16(stamp.date), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name]);
    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.concat([u32(0x06054b50), u16(0), u16(0), u16(assets.length), u16(assets.length), u32(centralDirectory.length), u32(offset), u16(0)]);
  await fs.writeFile(outputPath, Buffer.concat([...localParts, centralDirectory, end]));
  return outputPath;
}
