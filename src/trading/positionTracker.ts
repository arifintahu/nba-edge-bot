import * as fs from "fs";
import type { OrderResult } from "../types";

export interface Position {
  orderId: string;
  gameId: string;
  marketId: string;
  side: "home" | "away";
  amount: number;
  entryPrice: number;
  exitPrice?: number;
  pnl?: number;
  openedAt: string;
  closedAt?: string;
  status: "open" | "closed" | "pending";
}

export class PositionTracker {
  private positions: Position[] = [];

  open(order: OrderResult, amount: number, entryPrice: number): void {
    this.positions.push({
      orderId: order.orderId ?? order.timestamp,
      gameId: order.gameId,
      marketId: order.marketId,
      side: order.side,
      amount,
      entryPrice,
      openedAt: order.timestamp,
      status: "open",
    });
  }

  close(orderId: string, exitPrice: number): void {
    const pos = this.positions.find((p) => p.orderId === orderId && p.status === "open");
    if (!pos) return;
    pos.exitPrice = exitPrice;
    pos.closedAt = new Date().toISOString();
    pos.status = "closed";
    // pnl = (exitPrice - entryPrice) / entryPrice * amount for YES tokens
    pos.pnl = (exitPrice - pos.entryPrice) * pos.amount;
  }

  getOpenCount(): number {
    return this.positions.filter((p) => p.status === "open").length;
  }

  getTotalExposed(): number {
    return this.positions
      .filter((p) => p.status === "open")
      .reduce((sum, p) => sum + p.amount, 0);
  }

  getPnL(): number {
    return this.positions
      .filter((p) => p.pnl !== undefined)
      .reduce((sum, p) => sum + (p.pnl ?? 0), 0);
  }

  getSummary(): { open: number; closed: number; totalPnL: number; winRate: number } {
    const closed = this.positions.filter((p) => p.status === "closed");
    const wins = closed.filter((p) => (p.pnl ?? 0) > 0).length;
    return {
      open: this.getOpenCount(),
      closed: closed.length,
      totalPnL: this.getPnL(),
      winRate: closed.length > 0 ? wins / closed.length : 0,
    };
  }

  saveToFile(path: string): void {
    fs.writeFileSync(path, JSON.stringify(this.positions, null, 2));
  }

  loadFromFile(path: string): void {
    if (!fs.existsSync(path)) return;
    try {
      this.positions = JSON.parse(fs.readFileSync(path, "utf8")) as Position[];
    } catch {
      this.positions = [];
    }
  }
}
