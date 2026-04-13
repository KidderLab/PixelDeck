import { spawn } from "node:child_process";
import { config } from "@/lib/config";

export interface ProbeResult {
  width?: number;
  height?: number;
  durationMs?: number;
  mimeType?: string;
}

export async function runFfprobe(filePath: string): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    const args = ["-v", "quiet", "-print_format", "json", "-show_streams", "-show_format", filePath];
    const child = spawn(config.PIXELDECK_FFPROBE_PATH, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("exit", (code) => {
      if (code !== 0) return reject(new Error(stderr || `ffprobe exited ${code}`));
      const parsed = JSON.parse(stdout);
      const stream = parsed.streams?.find((item: { codec_type?: string }) => item.codec_type === "video") ?? parsed.streams?.[0] ?? {};
      const duration = Number(parsed.format?.duration ?? 0);
      resolve({ width: stream.width, height: stream.height, durationMs: Number.isFinite(duration) ? Math.round(duration * 1000) : undefined });
    });
    child.on("error", reject);
  });
}
