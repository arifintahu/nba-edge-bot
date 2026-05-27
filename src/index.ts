import { config } from "./config";
import { fetchLiveGames, fetchLiveGamesESPN } from "./data/nbaFetcher";
import { fetchMarketPriceByTeams } from "./market/marketFetcher";
import { detectEdge } from "./trading/edgeDetector";
import { kellySize, checkRiskLimits } from "./trading/riskEngine";
import { PositionTracker } from "./trading/positionTracker";
import { appendResult } from "./trading/resultsLogger";
import { computeWinProbability } from "./model/winProbability";
import { logger } from "./logger";
import { CanonClient } from "./canon/canonClient";
import type { GameState, RiskState } from "./types";


const tracker = new PositionTracker();
const RESULTS_PATH = "RESULTS.md";

const canonClient = new CanonClient({
  cliPath: config.canonCliPath,
  walletKey: config.walletPrivateKey,
  marketType: config.marketType as any,
});

const DRY_RUN = process.argv.includes("--dry-run") || config.dryRun;

async function processTick(): Promise<void> {
  let games: GameState[] = [];
  try {
    games = await fetchLiveGames(config.ballDontLieApiKey);
  } catch {
    try { games = await fetchLiveGamesESPN(); } catch { return; }
  }
  const liveGames = games.filter(g => g.status === "live");
  if (liveGames.length === 0) {
    logger.info("No live games");
    return;
  }

  const riskState: RiskState = {
    bankroll: config.startingBankroll,
    startingBankroll: config.startingBankroll,
    openPositions: tracker.getOpenCount(),
    totalExposed: tracker.getTotalExposed(),
    isHalted: false,
  };

  const haltReason = checkRiskLimits(riskState, config.stopLossFraction, config.maxOpenPositions);
  if (haltReason) {
    logger.warn("HALT: " + haltReason);
    process.exit(1);
  }

  for (const game of liveGames) {
    if (tracker.getOpenCount() >= config.maxOpenPositions) break;

    const market = await fetchMarketPriceByTeams(game.gameId, game.homeTeam, game.awayTeam, config.polymarketApiKey);
    if (!market) continue;

    const wp = computeWinProbability(game);
    const edge = detectEdge(wp, market, config.edgeThreshold);
    if (!edge.isActionable) continue;

    const bet = kellySize(edge, market, riskState, config.maxBetFraction, config.maxExposureFraction);
    if (bet.amount <= 0) continue;

    const tag = DRY_RUN ? "[DRY-RUN]" : "[LIVE]";
    console.log(tag + " EDGE " + game.homeTeam + " vs " + game.awayTeam
      + " | model=" + wp.homeWinProb.toFixed(3)
      + " market=" + market.homeImpliedProb.toFixed(3)
      + " edge=" + edge.edge.toFixed(3)
      + " stake=$" + bet.amount.toFixed(2)
    );

    const signal = {
      gameId: game.gameId,
      marketId: market.marketId,
      recommendedSide: edge.side,
      recommendedStake: bet.amount,
      modelHomeProb: wp.homeWinProb,
      modelAwayProb: wp.awayWinProb,
      homeMarketProb: market.homeImpliedProb,
      awayMarketProb: market.awayImpliedProb,
      edgeMagnitude: Math.abs(edge.edge),
    };

    const order = await canonClient.placeOrder(signal, DRY_RUN);
    logger.trade("Order", order as unknown as Record<string, unknown>);

    if (order.status === "submitted" || order.status === "dry-run") {
      tracker.open(order, order.amount, order.price);
      appendResult(RESULTS_PATH, {
        timestamp: order.timestamp,
        gameId: game.gameId,
        side: order.side,
        entryPrice: order.price,
        amount: order.amount,
        notes: DRY_RUN ? "dry-run" : "live",
      });
    }
  }

  const summary = tracker.getSummary();
  logger.info("Tick done", summary as unknown as Record<string, unknown>);
}

async function main(): Promise<void> {
  console.log("NBA Edge Bot starting | dry-run=" + DRY_RUN + " | poll=" + config.pollIntervalSeconds + "s");
  tracker.loadFromFile("positions.json");
  await processTick();
  setInterval(processTick, config.pollIntervalSeconds * 1000);
}

main().catch(console.error);