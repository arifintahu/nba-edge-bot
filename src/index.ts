import { Command } from "commander";
import { loadConfig } from "./config";
import { setLogPath, logger } from "./logger";
import { fetchLiveGames, fetchLiveGamesESPN } from "./data/nbaFetcher";
import { fetchMarketPriceByTeams } from "./market/marketFetcher";
import { computeWinProbability } from "./model/winProbability";
import { detectEdge } from "./trading/edgeDetector";
import { kellySize, checkRiskLimits } from "./trading/riskEngine";
import { executeOrder } from "./trading/executor";
import { PositionTracker } from "./trading/positionTracker";
import { appendResult } from "./trading/resultsLogger";
import type { RiskState } from "./types";
import * as path from "path";

const program = new Command();
program.option("--dry-run", "log intended trades without sending orders");
program.parse(process.argv);
const opts = program.opts();
const config = loadConfig(opts.dryRun ? true : undefined);

setLogPath(config.logPath);

const risk: RiskState = {
  bankroll: config.bankroll,
  startingBankroll: config.bankroll,
  openPositions: 0,
  totalExposed: 0,
  isHalted: false,
};

const tracker = new PositionTracker();
const positionsFile = path.join(process.cwd(), "logs", "positions.json");
const resultsFile = path.join(process.cwd(), "RESULTS.md");
tracker.loadFromFile(positionsFile);

async function tick(): Promise<void> {
  const halt = checkRiskLimits(risk, config.stopLossFraction, config.maxOpenPositions);
  if (halt) {
    logger.warn("HALTED: " + halt);
    risk.isHalted = true;
    process.exit(1);
  }

  let games;
  try {
    games = await fetchLiveGames(config.ballDontLieApiKey);
  } catch (err: any) {
    logger.warn("balldontlie failed, trying ESPN: " + err.message);
    try {
      games = await fetchLiveGamesESPN();
    } catch (err2: any) {
      logger.error("ESPN fetch also failed: " + err2.message);
      return;
    }
  }

  const liveGames = games.filter((g) => g.status === "live");
  logger.info("Live games: " + liveGames.length);

  // sync open positions from tracker
  risk.openPositions = tracker.getOpenCount();
  risk.totalExposed = tracker.getTotalExposed();

  for (const game of liveGames) {
    const winProb = computeWinProbability(game);

    const market = await fetchMarketPriceByTeams(game.gameId, game.homeTeam, game.awayTeam, config.polymarketApiKey);
    if (!market) {
      logger.warn("No market for game " + game.gameId);
      continue;
    }

    const signal = detectEdge(winProb, market, config.edgeThreshold);
    logger.info(
      game.homeTeam + " vs " + game.awayTeam +
      " | model=" + (winProb.homeWinProb * 100).toFixed(1) + "%" +
      " market=" + (market.homeImpliedProb * 100).toFixed(1) + "%" +
      " edge=" + (signal.edge * 100).toFixed(1) + "%" +
      (signal.isActionable ? " ACTIONABLE" : "")
    );

    if (!signal.isActionable) continue;

    const bet = kellySize(signal, market, risk, config.maxBetFraction, config.maxExposureFraction);
    if (bet.amount <= 0) {
      logger.warn("Bet amount is 0 for " + game.gameId);
      continue;
    }

    const order = await executeOrder(bet, market, config.dryRun);
    if (order.status !== "failed") {
      const entryPrice = bet.side === "home" ? market.homePrice : market.awayPrice;
      tracker.open(order, bet.amount, entryPrice);
      tracker.saveToFile(positionsFile);
      appendResult(resultsFile, {
        timestamp: order.timestamp,
        gameId: game.gameId,
        side: bet.side,
        entryPrice,
        amount: bet.amount,
        notes: config.dryRun ? "dry-run" : "",
      });
    }
  }

  const summary = tracker.getSummary();
  logger.info("Portfolio: open=" + summary.open + " closed=" + summary.closed + " PnL=" + summary.totalPnL.toFixed(2));
}

async function run(): Promise<void> {
  logger.info("nba-edge-bot starting", { dryRun: config.dryRun, bankroll: config.bankroll });
  while (true) {
    await tick().catch((err) => logger.error("tick error: " + err.message));
    await new Promise((r) => setTimeout(r, config.pollIntervalMs));
  }
}

run();
