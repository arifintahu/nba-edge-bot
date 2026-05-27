import { execSync, spawn } from "child_process";
import type { TradeSignal, OrderResult } from "../types";

export interface CanonConfig {
  cliPath: string;
  walletKey: string;
  marketType: "polymarket" | "manifold" | "mock";
}

export class CanonClient {
  private cfg: CanonConfig;

  constructor(cfg: CanonConfig) {
    this.cfg = cfg;
  }

  isAvailable(): boolean {
    try {
      execSync(this.cfg.cliPath + " --version", { stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  }

  async placeOrder(signal: TradeSignal, dryRun: boolean): Promise<OrderResult> {
    const ts = new Date().toISOString();
    if (dryRun || this.cfg.marketType === "mock" || !this.isAvailable()) {
      return {
        gameId: signal.gameId,
        marketId: signal.marketId,
        side: signal.recommendedSide,
        amount: signal.recommendedStake,
        price: signal.recommendedSide === "home" ? signal.homeMarketProb : signal.awayMarketProb,
        orderId: "dry-" + Date.now(),
        status: "dry-run",
        timestamp: ts,
      };
    }
    try {
      const args = [
        "order",
        "--market", signal.marketId,
        "--side", signal.recommendedSide,
        "--amount", signal.recommendedStake.toString(),
        "--key", this.cfg.walletKey,
      ];
      const out = execSync(this.cfg.cliPath + " " + args.join(" "), { stdio: "pipe" }).toString();
      const parsed = JSON.parse(out);
      return {
        gameId: signal.gameId,
        marketId: signal.marketId,
        side: signal.recommendedSide,
        amount: signal.recommendedStake,
        price: parsed.price ?? 0,
        orderId: parsed.orderId ?? parsed.id,
        status: "submitted",
        timestamp: ts,
      };
    } catch (e: any) {
      return {
        gameId: signal.gameId,
        marketId: signal.marketId,
        side: signal.recommendedSide,
        amount: signal.recommendedStake,
        price: 0,
        status: "failed",
        errorMessage: e.message,
        timestamp: ts,
      };
    }
  }
}