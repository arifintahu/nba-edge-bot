import { kellySize, checkRiskLimits } from "../src/trading/riskEngine";
import type { EdgeSignal, MarketPrice, RiskState } from "../src/types";

function risk(overrides: Partial<RiskState> = {}): RiskState {
  return { bankroll: 100, startingBankroll: 100, openPositions: 0, totalExposed: 0, isHalted: false, ...overrides };
}

function signal(edge = 0.10, side: "home" | "away" = "home"): EdgeSignal {
  return { gameId: "g1", marketId: "m1", side, modelProb: 0.65, marketProb: 0.55, edge, isActionable: true, threshold: 0.05 };
}

function market(): MarketPrice {
  return { marketId: "m1", gameId: "g1", homeImpliedProb: 0.55, awayImpliedProb: 0.45, homePrice: 0.55, awayPrice: 0.45, source: "mock", timestamp: "" };
}

describe("kellySize", () => {
  test("returns positive amount for positive edge", () => {
    const b = kellySize(signal(), market(), risk(), 0.05, 0.10);
    expect(b.amount).toBeGreaterThan(0);
  });

  test("caps at maxBetFraction of bankroll", () => {
    const b = kellySize(signal(0.9), market(), risk(), 0.05, 0.10);
    expect(b.amount).toBeLessThanOrEqual(5.01); // 5% of 100
    expect(b.cappedByMaxBet).toBe(true);
  });

  test("caps by exposure when near limit", () => {
    const b = kellySize(signal(), market(), risk({ totalExposed: 9.5 }), 0.05, 0.10);
    expect(b.amount).toBeLessThanOrEqual(0.51);
    expect(b.cappedByExposure).toBe(true);
  });
});

describe("checkRiskLimits", () => {
  test("no halt when healthy", () => {
    expect(checkRiskLimits(risk(), 0.20, 3)).toBeNull();
  });

  test("halts on stop-loss drawdown", () => {
    const msg = checkRiskLimits(risk({ bankroll: 70, startingBankroll: 100 }), 0.20, 3);
    expect(msg).toMatch(/stop-loss/);
  });

  test("halts on max open positions", () => {
    const msg = checkRiskLimits(risk({ openPositions: 3 }), 0.20, 3);
    expect(msg).toMatch(/max open/);
  });

  test("halts when already halted", () => {
    const msg = checkRiskLimits(risk({ isHalted: true, haltReason: "test" }), 0.20, 3);
    expect(msg).toBe("test");
  });
});