import * as fs from "fs";
import * as path from "path";
import type { Config } from "./types";

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf-8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (val.length >= 2) {
      const first = val[0]; const last = val[val.length - 1];
      if ((first === "\"" && last === "\"") || (first === "'" && last === "'")) { val = val.slice(1, -1); }
    }
    if (!(key in process.env)) { process.env[key] = val; }
  }
}

export function loadConfig(dryRunOverride?: boolean): Config {
  loadEnvFile(path.resolve(process.cwd(), ".env"));
  const bankroll = parseFloat(process.env["BANKROLL"] ?? "50");
  const edgeThreshold = parseFloat(process.env["EDGE_THRESHOLD"] ?? "0.05");
  const maxBetFraction = parseFloat(process.env["MAX_BET_FRACTION"] ?? "0.05");
  const maxOpenPositions = parseInt(process.env["MAX_OPEN_POSITIONS"] ?? "3", 10);
  const maxExposureFraction = parseFloat(process.env["MAX_EXPOSURE_FRACTION"] ?? "0.10");
  const stopLossFraction = parseFloat(process.env["STOP_LOSS_FRACTION"] ?? "0.20");
  const pollIntervalMs = parseInt(process.env["POLL_INTERVAL_MS"] ?? "30000", 10);
  let dryRun: boolean;
  if (dryRunOverride !== undefined) { dryRun = dryRunOverride; } else {
    const envVal = (process.env["DRY_RUN"] ?? "true").toLowerCase();
    dryRun = envVal !== "false";
  }
  return {
    ballDontLieApiKey: process.env["BALLDONTLIE_API_KEY"] ?? "",
    polymarketApiKey: process.env["POLYMARKET_API_KEY"] ?? "",
    bankroll: isNaN(bankroll) ? 50 : bankroll,
    edgeThreshold: isNaN(edgeThreshold) ? 0.05 : edgeThreshold,
    maxBetFraction: isNaN(maxBetFraction) ? 0.05 : maxBetFraction,
    maxOpenPositions: isNaN(maxOpenPositions) ? 3 : maxOpenPositions,
    maxExposureFraction: isNaN(maxExposureFraction) ? 0.10 : maxExposureFraction,
    stopLossFraction: isNaN(stopLossFraction) ? 0.20 : stopLossFraction,
    pollIntervalMs: isNaN(pollIntervalMs) ? 30000 : pollIntervalMs,
    dryRun,
    logPath: process.env["LOG_PATH"] ?? "./logs/trades.jsonl",
    startingBankroll: isNaN(bankroll) ? 50 : bankroll,
    pollIntervalSeconds: isNaN(pollIntervalMs) ? 30 : pollIntervalMs / 1000,
    canonCliPath: process.env["CANON_CLI_PATH"] ?? "canon",
    walletPrivateKey: process.env["WALLET_PRIVATE_KEY"] ?? "",
    marketType: process.env["MARKET_TYPE"] ?? "mock",
  };
}
export const config = loadConfig();
