import axios from "axios";
import type { MarketPrice } from "../types";

interface PolymarketMarket {
  condition_id: string;
  question: string;
  tokens: Array<{ token_id: string; outcome: string; price: string }>;
  active: boolean;
  closed: boolean;
}

export async function searchNBAMarket(
  homeTeam: string,
  awayTeam: string,
  gameId: string,
  apiKey: string
): Promise<MarketPrice | null> {
  if (!apiKey || apiKey === "mock") return null;
  try {
    const resp = await axios.get("https://clob.polymarket.com/markets", {
      headers: { Authorization: "Bearer " + apiKey },
      params: { limit: 100, tag: "nba" },
      timeout: 5000,
    });
    const markets: PolymarketMarket[] = resp.data.data ?? resp.data ?? [];
    const homeKey = homeTeam.split(" ").pop()!.toLowerCase();
    const awayKey = awayTeam.split(" ").pop()!.toLowerCase();
    const match = markets.find((m) => {
      const q = m.question.toLowerCase();
      return q.includes(homeKey) && q.includes(awayKey) && !m.closed;
    });
    if (!match || match.tokens.length < 2) return null;
    const homePrice = parseFloat(match.tokens[0].price ?? "0.5");
    const awayPrice = parseFloat(match.tokens[1].price ?? "0.5");
    return {
      marketId: match.condition_id,
      gameId,
      homeImpliedProb: homePrice,
      awayImpliedProb: awayPrice,
      homePrice,
      awayPrice,
      source: "polymarket",
      timestamp: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
