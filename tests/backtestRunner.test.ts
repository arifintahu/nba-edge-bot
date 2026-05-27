import { backtestGame } from "../src/backtest/backtestRunner";

describe("backtestRunner", () => {
  it("returns correct winner for home blowout", () => {
    const r = backtestGame("g1", "Lakers", "Celtics", 120, 90);
    expect(r.actualWinner).toBe("home");
    expect(r.correctAtEnd).toBe(true);
    expect(r.snapshots.length).toBeGreaterThan(0);
  });
  it("returns correct winner for away win", () => {
    const r = backtestGame("g2", "Lakers", "Celtics", 90, 110);
    expect(r.actualWinner).toBe("away");
    expect(r.correctAtEnd).toBe(true);
  });
  it("prob converges to 1 for big home lead at end", () => {
    const r = backtestGame("g3", "Lakers", "Celtics", 130, 80);
    expect(r.finalMinuteProb).toBeGreaterThan(0.9);
  });
  it("late-game tie near 0.5", () => {
    const r = backtestGame("g4", "Lakers", "Celtics", 100, 100);
    const last = r.snapshots[r.snapshots.length - 1];
    expect(last.modelHomeProb).toBeGreaterThan(0.4);
    expect(last.modelHomeProb).toBeLessThan(0.7);
  });
});