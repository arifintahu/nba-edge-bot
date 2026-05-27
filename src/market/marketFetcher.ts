import axios from "axios";
import type { MarketPrice } from "../types";

// Mock market prices for dry-run / testing
const MOCK_MARKETS: Record<string, MarketPrice> = {};

export function registerMockMarket(gameId: string, price: MarketPrice): void {
  MOCK_MARKETS[gameId] = price;
}

export async function fetchMarketPrice(gameId: string, apiKey: string): Promise<MarketPrice | null> {
  if (!apiKey || apiKey === "mock") {
    return MOCK_MARKETS[gameId] ?? {
      marketId: gameId + "-mock",
      gameId,
      homeImpliedProb: 0.5,
      awayImpliedProb: 0.5,
      homePrice: 0.5,
      awayPrice: 0.5,
      source: "mock",
      timestamp: new Date().toISOString(),
    };
  }
  try {
    // Polymarket: slug = nba-<gameId>; prices come as YES/NO token prices
    const resp = await axios.get("https://clob.polymarket.com/markets/" + gameId, {
      headers: { Authorization: "Bearer " + apiKey },
    });
    const d = resp.data;
    const homePrice = parseFloat(d.tokens[0].price ?? 0.5);
    const awayPrice = parseFloat(d.tokens[1].price ?? 0.5);
    return {
      marketId: d.condition_id,
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