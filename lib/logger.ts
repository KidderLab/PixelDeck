import fs from "node:fs";
import path from "node:path";
import { config } from "@/lib/config";

function writeLine(fileName: string, level: string, message: string, metadata?: Record<string, unknown>) {
  fs.mkdirSync(config.paths.logs, { recursive: true });
  const line = JSON.stringify({ ts: new Date().toISOString(), level, message, metadata }) + "\n";
  fs.appendFileSync(path.join(config.paths.logs, fileName), line);
}

export const logger = {
  info(message: string, metadata?: Record<string, unknown>) {
    writeLine("app.log", "info", message, metadata);
  },
  error(message: string, metadata?: Record<string, unknown>) {
    writeLine("app.log", "error", message, metadata);
  },
  worker(message: string, metadata?: Record<string, unknown>) {
    writeLine("worker.log", "info", message, metadata);
  }
};
