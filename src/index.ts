import { config } from "./config";
import { fetchLiveGames, fetchLiveGamesESPN } from "./data/nbaFetcher";
import { fetchMarketPriceByTeams } from "./market/marketFetcher";
import { detectEdge } from "./trading/edgeDetector";
import { kellySize, checkRiskLimits } from "./trading/riskEngine";
import { PositionTracker } from "./trading/positionTracker";
import { SimulateTracker } from "./trading/simulateTracker";
import { appendResult } from "./trading/resultsLogger";
import { computeWinProbability } from "./model/winProbability";
import { logger } from "./logger";
import { CanonClient } from "./canon/canonClient";
import type { GameState, RiskState } from "./types";

const tracker = new PositionTracker();
const simTracker = new SimulateTracker(config.startingBankroll);
const RESULTS_PATH = "RESULTS.md";
const SIMULATE_PATH = "SIMULATE.md";
const SIM_POSITIONS_PATH = "sim-positions.json";

const canonClient = new CanonClient({
  cliPath: config.canonCliPath,
  walletKey: config.walletPrivateKey,
  marketType: config.marketType as any,
});

const DRY_RUN = process.argv.includes("--dry-run") || config.dryRun;
const SIMULATE = process.argv.includes("--simulate");

async function processTick(): Promise<void> {
  let games: GameState[] = [];
  try {
    games = await fetchLiveGames(config.ballDontLieApiKey);
  } catch {
    try { games = await fetchLiveGamesESPN(); } catch { return; }
  }
  const liveGames = games.filter(g => g.status === "live");
  const finalGames = games.filter(g => g.status === "final");

  if (SIMULATE && finalGames.length > 0) {
    for (const g of finalGames) {
      const diff = g.homeScore - g.awayScore;
      const winner = diff > 0 ? "home" : "away";
      simTracker.resolveGame(g.gameId, winner as "home" | "away");
    }
    simTracker.savePositions(SIM_POSITIONS_PATH);
    simTracker.writeReport(SIMULATE_PATH);
  }

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

    const entryPrice = edge.side === "home" ? market.homePrice : market.awayPrice;
    const modeLabel = SIMULATE ? "[SIMULATE]" : DRY_RUN ? "[DRY-RUN]" : "[LIVE]";
    console.log(modeLabel + " EDGE " + game.homeTeam + " vs " + game.awayTeam
      + " | model=" + wp.homeWinProb.toFixed(3)
      + " market=" + market.homeImpliedProb.toFixed(3)
      + " edge=" + edge.edge.toFixed(3)
      + " stake=$" + bet.amount.toFixed(2)
    );

    if (SIMULATE) {
      simTracker.open({
        gameId: game.gameId,
        marketId: market.marketId,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        side: edge.side,
        entryPrice,
        stake: bet.amount,
        modelProb: edge.side === "home" ? wp.homeWinProb : wp.awayWinProb,
        edge: edge.edge,
        openedAt: new Date().toISOString(),
      });
      simTracker.savePositions(SIM_POSITIONS_PATH);
      simTracker.writeReport(SIMULATE_PATH);
      continue;
    }

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

  if (SIMULATE) {
    const simSummary = simTracker.getSummary();
    console.log("[SIMULATE] bankroll=$" + config.startingBankroll.toFixed(2)
      + " trades=" + simSummary.totalTrades
      + " open=" + simSummary.openTrades
      + " pnl=" + (simSummary.totalPnL >= 0 ? "+" : "") + "$" + simSummary.totalPnL.toFixed(2)
    );
  }
}

async function main(): Promise<void> {
  const mode = SIMULATE ? "simulate" : DRY_RUN ? "dry-run" : "live";
  console.log("NBA Edge Bot starting | mode=" + mode + " | poll=" + config.pollIntervalSeconds + "s");
  if (SIMULATE) {
    simTracker.loadFromFile(SIM_POSITIONS_PATH);
    console.log("Simulate mode — trades logged to SIMULATE.md (no real orders placed)");
  } else {
    tracker.loadFromFile("positions.json");
  }
  await processTick();
  setInterval(processTick, config.pollIntervalSeconds * 1000);
}

main().catch(console.error);