import { backtestGame } from "../src/backtest/backtestRunner";
import { HISTORICAL_GAMES } from "../src/backtest/historicalGames";

function run(): void {
  console.log("NBA Win-Probability Backtest\n");
  let correct = 0;
  for (const game of HISTORICAL_GAMES) {
    const result = backtestGame(game.gameId, game.homeTeam, game.awayTeam, game.finalHomeScore, game.finalAwayScore);
    const tick = result.correctAtEnd ? "PASS" : "FAIL";
    console.log(tick + " " + game.homeTeam + " vs " + game.awayTeam + " | winner=" + result.actualWinner + " finalProb=" + result.finalMinuteProb.toFixed(3));
    if (result.correctAtEnd) correct++;
  }
  const pct = (correct / HISTORICAL_GAMES.length * 100).toFixed(1);
  console.log("\nAccuracy: " + correct + "/" + HISTORICAL_GAMES.length + " (" + pct + "%)");
}

run();