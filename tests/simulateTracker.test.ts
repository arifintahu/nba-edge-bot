import { SimulateTracker } from "../src/trading/simulateTracker";

describe("SimulateTracker", () => {
  let tracker: SimulateTracker;

  beforeEach(() => {
    tracker = new SimulateTracker(100);
  });

  const basePos = {
    gameId: "g1",
    marketId: "m1",
    homeTeam: "Lakers",
    awayTeam: "Warriors",
    side: "home" as const,
    entryPrice: 0.65,
    stake: 10,
    modelProb: 0.72,
    edge: 0.07,
    openedAt: new Date().toISOString(),
  };

  it("opens a position and returns an id", () => {
    const id = tracker.open(basePos);
    expect(id).toMatch(/^sim-/);
    expect(tracker.getPositions()).toHaveLength(1);
  });

  it("resolves win correctly", () => {
    tracker.open(basePos);
    tracker.resolveGame("g1", "home");
    const s = tracker.getSummary();
    expect(s.wins).toBe(1);
    expect(s.losses).toBe(0);
    expect(s.totalPnL).toBeCloseTo(5.38, 1);
  });

  it("resolves loss correctly", () => {
    tracker.open(basePos);
    tracker.resolveGame("g1", "away");
    const s = tracker.getSummary();
    expect(s.wins).toBe(0);
    expect(s.losses).toBe(1);
    expect(s.totalPnL).toBe(-10);
  });

  it("does not double-resolve", () => {
    tracker.open(basePos);
    tracker.resolveGame("g1", "home");
    tracker.resolveGame("g1", "away");
    const s = tracker.getSummary();
    expect(s.closedTrades).toBe(1);
  });

  it("profitPct is correct", () => {
    tracker.open(basePos);
    tracker.resolveGame("g1", "home");
    const s = tracker.getSummary();
    expect(s.profitPct).toBeCloseTo(53.8, 0);
  });

  it("winRate is 0 when no closed trades", () => {
    tracker.open(basePos);
    expect(tracker.getSummary().winRate).toBe(0);
  });

  it("writeReport does not throw", () => {
    const tmp = "/tmp/sim-test.md";
    tracker.open(basePos);
    tracker.resolveGame("g1", "home");
    expect(() => tracker.writeReport(tmp)).not.toThrow();
  });
});