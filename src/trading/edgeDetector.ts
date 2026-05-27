import type { WinProbability, MarketPrice, EdgeSignal } from "../types";

export function detectEdge(
  winProb: WinProbability,
  market: MarketPrice,
  threshold: number
): EdgeSignal {
  const homeEdge = winProb.homeWinProb - market.homeImpliedProb;
  const awayEdge = winProb.awayWinProb - market.awayImpliedProb;

  // Pick the side with the larger positive edge (we can only bet on the underpriced side)
  const side: "home" | "away" = awayEdge > homeEdge ? "away" : "home";
  const edge = side === "home" ? homeEdge : awayEdge;
  const modelProb = side === "home" ? winProb.homeWinProb : winProb.awayWinProb;
  const marketProb = side === "home" ? market.homeImpliedProb : market.awayImpliedProb;

  return {
    gameId: winProb.gameId,
    marketId: market.marketId,
    side,
    modelProb,
    marketProb,
    edge,
    isActionable: edge > threshold,
    threshold,
  };
}