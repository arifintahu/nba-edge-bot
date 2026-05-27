import { computeWinProbability } from "../src/model/winProbability";
import type { GameState } from "../src/types";

function state(overrides: Partial<GameState> = {}): GameState {
  return {
    gameId: "test-1", homeTeam: "A", awayTeam: "B",
    homeScore: 0, awayScore: 0, secondsRemaining: 0,
    quarter: 4, possession: 0, timestamp: "2026-01-01T00:00:00Z",
    status: "live",
    ...overrides,
  };
}

describe("computeWinProbability", () => {
  test("tied game at full time returns ~0.5", () => {
    const r = computeWinProbability(state());
    expect(r.homeWinProb).toBeCloseTo(0.5, 1);
  });

  test("home leads big with 0s left → home wins", () => {
    const r = computeWinProbability(state({ homeScore: 20, awayScore: 0, secondsRemaining: 0 }));
    expect(r.homeWinProb).toBeGreaterThan(0.95);
  });

  test("away leads big with 0s left → away wins", () => {
    const r = computeWinProbability(state({ homeScore: 0, awayScore: 20, secondsRemaining: 0 }));
    expect(r.homeWinProb).toBeLessThan(0.05);
  });

  test("early game, tied → closer to 0.5 than late game", () => {
    const early = computeWinProbability(state({ homeScore: 5, awayScore: 0, secondsRemaining: 2000 }));
    const late = computeWinProbability(state({ homeScore: 5, awayScore: 0, secondsRemaining: 60 }));
    expect(early.homeWinProb).toBeLessThan(late.homeWinProb);
  });

  test("home + away probs sum to 1", () => {
    const r = computeWinProbability(state({ homeScore: 3, awayScore: 1, secondsRemaining: 500 }));
    expect(r.homeWinProb + r.awayWinProb).toBeCloseTo(1, 10);
  });

  test("possession edge: home possessing gives slight boost", () => {
    const with_ = computeWinProbability(state({ possession: 1, secondsRemaining: 10 }));
    const without = computeWinProbability(state({ possession: -1, secondsRemaining: 10 }));
    expect(with_.homeWinProb).toBeGreaterThan(without.homeWinProb);
  });
});