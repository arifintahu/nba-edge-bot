import type { EdgeSignal, MarketPrice, BetSize, RiskState } from "../types";

export function kellySize(
  signal: EdgeSignal,
  market: MarketPrice,
  risk: RiskState,
  maxBetFraction: number,
  maxExposureFraction: number
): BetSize {
  const price = signal.side === "home" ? market.homePrice : market.awayPrice;
  const decimalOdds = 1 / price; // implied decimal odds from market price
  const B = decimalOdds - 1;
  const P = signal.modelProb;

  // Full Kelly: (P*B - (1-P)) / B
  const fullKelly = (P * B - (1 - P)) / B;
  const quarterKelly = Math.max(0, fullKelly * 0.25);

  let amount = risk.bankroll * quarterKelly;
  let cappedByMaxBet = false;
  let cappedByExposure = false;

  const maxByFraction = risk.bankroll * maxBetFraction;
  if (amount > maxByFraction) {
    amount = maxByFraction;
    cappedByMaxBet = true;
  }

  const roomLeft = risk.bankroll * maxExposureFraction - risk.totalExposed;
  if (amount > roomLeft) {
    amount = Math.max(0, roomLeft);
    cappedByExposure = true;
  }

  return {
    gameId: signal.gameId,
    side: signal.side,
    amount: Math.round(amount * 100) / 100,
    kellyFraction: fullKelly,
    actualFraction: quarterKelly,
    bankroll: risk.bankroll,
    decimalOdds,
    cappedByMaxBet,
    cappedByExposure,
  };
}

export function checkRiskLimits(risk: RiskState, stopLossFraction: number, maxOpenPositions: number): string | null {
  if (risk.isHalted) return risk.haltReason ?? "already halted";
  const drawdown = (risk.startingBankroll - risk.bankroll) / risk.startingBankroll;
  if (drawdown >= stopLossFraction) return "stop-loss triggered: drawdown " + (drawdown * 100).toFixed(1) + "%";
  if (risk.openPositions >= maxOpenPositions) return "max open positions reached: " + risk.openPositions;
  return null;
}