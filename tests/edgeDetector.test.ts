import { detectEdge } from "../src/trading/edgeDetector";
import type { WinProbability, MarketPrice } from "../src/types";

function wp(home: number, gameId = "g1"): WinProbability {
  return { gameId, homeWinProb: home, awayWinProb: 1 - home, scoreDiff: 0, secondsRemaining: 300, modelVersion: "1.0.0" };
}

function mp(home: number, gameId = "g1"): MarketPrice {
  return { marketId: "m1", gameId, homeImpliedProb: home, awayImpliedProb: 1 - home, homePrice: home, awayPrice: 1 - home, source: "mock", timestamp: "" };
}

describe("detectEdge", () => {
  test("no edge when model == market", () => {
    const s = detectEdge(wp(0.6), mp(0.6), 0.05);
    expect(s.isActionable).toBe(false);
    expect(s.edge).toBeCloseTo(0, 5);
  });

  test("edge detected when model > market by more than threshold", () => {
    const s = detectEdge(wp(0.70), mp(0.60), 0.05);
    expect(s.isActionable).toBe(true);
    expect(s.side).toBe("home");
    expect(s.edge).toBeCloseTo(0.10, 5);
  });

  test("edge on away side", () => {
    const s = detectEdge(wp(0.30), mp(0.40), 0.05);
    // away model = 0.70, away market = 0.60 → edge 0.10
    expect(s.isActionable).toBe(true);
    expect(s.side).toBe("away");
  });

  test("below threshold is not actionable", () => {
    const s = detectEdge(wp(0.62), mp(0.60), 0.05);
    expect(s.isActionable).toBe(false);
  });
});