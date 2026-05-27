import * as fs from "fs";

export interface SimPosition {
  id: string;
  gameId: string;
  marketId: string;
  homeTeam: string;
  awayTeam: string;
  side: "home" | "away";
  entryPrice: number;
  stake: number;
  modelProb: number;
  edge: number;
  openedAt: string;
  closedAt?: string;
  winner?: "home" | "away";
  pnl?: number;
  status: "open" | "closed";
}

export interface SimSummary {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalStaked: number;
  totalPnL: number;
  profitPct: number;
}

export class SimulateTracker {
  private positions: SimPosition[] = [];
  private startingBankroll: number;

  constructor(startingBankroll = 100) {
    this.startingBankroll = startingBankroll;
  }

  open(pos: Omit<SimPosition, "id" | "status">): string {
    const id = "sim-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
    this.positions.push({ ...pos, id, status: "open" });
    return id;
  }

  resolveGame(gameId: string, winner: "home" | "away"): void {
    for (const pos of this.positions) {
      if (pos.gameId !== gameId || pos.status === "closed") continue;
      pos.winner = winner;
      pos.closedAt = new Date().toISOString();
      pos.status = "closed";
      if (pos.side === winner) {
        const payout = pos.stake / pos.entryPrice;
        pos.pnl = payout - pos.stake;
      } else {
        pos.pnl = -pos.stake;
      }
    }
  }

  getSummary(): SimSummary {
    const closed = this.positions.filter((p) => p.status === "closed");
    const wins = closed.filter((p) => (p.pnl ?? 0) > 0);
    const totalStaked = this.positions.reduce((s, p) => s + p.stake, 0);
    const totalPnL = closed.reduce((s, p) => s + (p.pnl ?? 0), 0);
    return {
      totalTrades: this.positions.length,
      closedTrades: closed.length,
      openTrades: this.positions.filter((p) => p.status === "open").length,
      wins: wins.length,
      losses: closed.length - wins.length,
      winRate: closed.length > 0 ? wins.length / closed.length : 0,
      totalStaked,
      totalPnL,
      profitPct: totalStaked > 0 ? (totalPnL / totalStaked) * 100 : 0,
    };
  }

  writeReport(path: string): void {
    const s = this.getSummary();
    const pnlSign = s.totalPnL >= 0 ? "+" : "";
    const br = this.startingBankroll.toFixed(2);
    const now = new Date().toISOString();
    const lines: string[] = [
      "# Simulation Results",
      "",
      "Starting bankroll: $" + br,
      "Generated: " + now,
      "",
      "## Summary",
      "",
      "| Metric | Value |",
      "|--------|-------|"
    ];
    lines.push("| Total trades | " + s.totalTrades + " |");
    lines.push("| Closed | " + s.closedTrades + " |");
    lines.push("| Open | " + s.openTrades + " |");
    lines.push("| Wins | " + s.wins + " |");
    lines.push("| Losses | " + s.losses + " |");
    lines.push("| Win rate | " + (s.winRate * 100).toFixed(1) + "% |");
    lines.push("| Total staked | $" + s.totalStaked.toFixed(2) + " |");
    lines.push("| Total P&L | " + pnlSign + "$" + s.totalPnL.toFixed(2) + " |");
    lines.push("| Profit % | " + pnlSign + s.profitPct.toFixed(2) + "% |");
    lines.push("");
    lines.push("## Trade Log");
    lines.push("");
    lines.push("| Time | Game | Side | Entry | Stake | Model | Edge | Winner | P&L |");
    lines.push("|------|------|------|-------|-------|-------|------|--------|-----|")
    ;
    for (const p of this.positions) {
      const winner = p.winner ?? "-";
      const pnlStr = p.pnl !== undefined
        ? (p.pnl >= 0 ? "+" : "") + "$" + p.pnl.toFixed(2)
        : "open";
      const edgeStr = (p.edge >= 0 ? "+" : "") + (p.edge * 100).toFixed(1) + "%";
      lines.push(
        "| " + p.openedAt.slice(11,19) +
        " | " + p.homeTeam + " vs " + p.awayTeam +
        " | " + p.side +
        " | " + p.entryPrice.toFixed(3) +
        " | $" + p.stake.toFixed(2) +
        " | " + p.modelProb.toFixed(3) +
        " | " + edgeStr +
        " | " + winner +
        " | " + pnlStr + " |"
      );
    }
    fs.writeFileSync(path, lines.join("\n") + "\n");
  }

  getPositions(): SimPosition[] { return this.positions; }

  loadFromFile(path: string): void {
    if (!fs.existsSync(path)) return;
    try { this.positions = JSON.parse(fs.readFileSync(path, "utf8")); } catch { this.positions = []; }
  }

  savePositions(path: string): void {
    fs.writeFileSync(path, JSON.stringify(this.positions, null, 2));
  }
}