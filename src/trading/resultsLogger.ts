import * as fs from "fs";

export interface ResultEntry {
  timestamp: string;
  gameId: string;
  side: string;
  entryPrice: number;
  exitPrice?: number;
  amount: number;
  pnl?: number;
  notes?: string;
}

export function appendResult(resultsPath: string, entry: ResultEntry): void {
  const date = entry.timestamp.slice(0, 10);
  const exitStr = entry.exitPrice !== undefined ? entry.exitPrice.toFixed(4) : "-";
  const pnlStr = entry.pnl !== undefined ? (entry.pnl >= 0 ? "+" : "") + entry.pnl.toFixed(2) : "-";
  const notes = entry.notes ?? "";
  const row = [
    date,
    entry.gameId,
    entry.side,
    entry.entryPrice.toFixed(4),
    exitStr,
    entry.amount.toFixed(2),
    pnlStr,
    notes,
  ].join(" | ");
  const line = "| " + row + " |";
  if (!fs.existsSync(resultsPath)) {
    const header = [
      "# Trading Results",
      "",
      "| Date | Game | Side | Entry | Exit | Amount | PnL | Notes |",
      "|------|------|------|-------|------|--------|-----|-------|",
    ].join("
");
    fs.writeFileSync(resultsPath, header + "
");
  }
  fs.appendFileSync(resultsPath, line + "
");
}
