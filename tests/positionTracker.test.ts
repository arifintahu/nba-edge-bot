import { PositionTracker } from "../src/trading/positionTracker";
import type { OrderResult } from "../src/types";

function makeOrder(id: string): OrderResult {
  return { orderId: id, gameId: "g1", marketId: "m1", side: "home", amount: 10, price: 0.6, status: "submitted", timestamp: new Date().toISOString() };
}

describe("PositionTracker", () => {
  it("opens and counts positions", () => {
    const t = new PositionTracker();
    t.open(makeOrder("o1"), 10, 0.6);
    t.open(makeOrder("o2"), 5, 0.55);
    expect(t.getOpenCount()).toBe(2);
    expect(t.getTotalExposed()).toBe(15);
  });
  it("closes a position and calculates pnl", () => {
    const t = new PositionTracker();
    t.open(makeOrder("o1"), 10, 0.6);
    t.close("o1", 0.75);
    expect(t.getOpenCount()).toBe(0);
    expect(t.getPnL()).toBeCloseTo(1.5);
  });
  it("win rate is 1 for all winning trades", () => {
    const t = new PositionTracker();
    t.open(makeOrder("o1"), 10, 0.5);
    t.close("o1", 0.8);
    const s = t.getSummary();
    expect(s.winRate).toBe(1);
  });
  it("win rate is 0 for losing trade", () => {
    const t = new PositionTracker();
    t.open(makeOrder("o1"), 10, 0.7);
    t.close("o1", 0.3);
    const s = t.getSummary();
    expect(s.winRate).toBe(0);
  });
});