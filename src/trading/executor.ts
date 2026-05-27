import axios from "axios";
import type { BetSize, MarketPrice, OrderResult } from "../types";
import { logger } from "../logger";

// Canon CLI HTTP gateway (default local port)
const CANON_URL = process.env["CANON_URL"] ?? "http://localhost:3456";

async function submitViaCanon(bet: BetSize, market: MarketPrice): Promise<OrderResult> {
  const side = bet.side === "home" ? market.homePrice : market.awayPrice;
  const resp = await axios.post(CANON_URL + "/order", {
    marketId: market.marketId,
    outcome: bet.side,
    amount: bet.amount,
    price: side,
  });
  return {
    gameId: bet.gameId,
    marketId: market.marketId,
    side: bet.side,
    amount: bet.amount,
    price: side,
    orderId: resp.data.orderId,
    status: "submitted",
    timestamp: new Date().toISOString(),
  };
}

export async function executeOrder(
  bet: BetSize,
  market: MarketPrice,
  dryRun: boolean
): Promise<OrderResult> {
  const price = bet.side === "home" ? market.homePrice : market.awayPrice;
  if (dryRun || bet.amount <= 0) {
    const result: OrderResult = {
      gameId: bet.gameId,
      marketId: market.marketId,
      side: bet.side,
      amount: bet.amount,
      price,
      status: "dry-run",
      timestamp: new Date().toISOString(),
    };
    logger.trade("DRY-RUN order", result);
    return result;
  }
  try {
    const result = await submitViaCanon(bet, market);
    logger.trade("ORDER submitted", result);
    return result;
  } catch (err: any) {
    const result: OrderResult = {
      gameId: bet.gameId,
      marketId: market.marketId,
      side: bet.side,
      amount: bet.amount,
      price,
      status: "failed",
      errorMessage: err.message,
      timestamp: new Date().toISOString(),
    };
    logger.error("Order failed", result);
    return result;
  }
}