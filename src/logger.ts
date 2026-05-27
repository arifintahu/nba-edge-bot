import * as fs from "fs";
import * as path from "path";
import type { TradeLogEntry } from "./types";

let logPath = "./logs/trades.jsonl";

export function setLogPath(p: string): void {
  logPath = p;
  const dir = path.dirname(logPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function write(entry: TradeLogEntry): void {
  const line = JSON.stringify(entry) + "
";
  const ts = entry.timestamp.slice(11, 19);
  const lvl = entry.level.toUpperCase().padEnd(5);
  console.log("[" + ts + "] " + lvl + " " + entry.message);
  try { fs.appendFileSync(logPath, line); } catch {}
}

export const logger = {
  info(message: string, data?: Record<string, unknown>): void {
    write({ level: "info", timestamp: new Date().toISOString(), message, data });
  },
  warn(message: string, data?: Record<string, unknown>): void {
    write({ level: "warn", timestamp: new Date().toISOString(), message, data });
  },
  error(message: string, data?: Record<string, unknown>): void {
    write({ level: "error", timestamp: new Date().toISOString(), message, data });
  },
  trade(message: string, data?: Record<string, unknown>): void {
    write({ level: "trade", timestamp: new Date().toISOString(), message, data });
  },
};