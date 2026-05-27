# Architecture

## Data Flow

```
BallDontLie API (live play-by-play)
        |  fallback --- ESPN public JSON
        v
  GameState { homeScore, awayScore, secondsRemaining, possession }
        |
        v
Win Probability Model (src/model/winProbability.ts)
  P = sigmoid(0.15 * scoreDiff - 0.03 * sqrt(secondsRemaining) + 0.5 * possession)
        |
        v
  WinProbability { homeWinProb, awayWinProb }
        |
        |-- Polymarket CLOB API (src/market/polymarketSearch.ts)
        |          MarketPrice { homeImpliedProb, awayImpliedProb }
        v
Edge Detector (src/trading/edgeDetector.ts)
  edge = modelProb - marketProb; actionable when |edge| > THRESHOLD (default 0.05)
        |
        v
Risk Engine (src/trading/riskEngine.ts)
  Kelly fraction: f* = (P*B - (1-P)) / B
  Actual bet = bankroll x f* x 0.25, capped at MAX_BET_FRACTION
  Stop-loss: halt if bankroll < (1 - STOP_LOSS_FRACTION) x startingBankroll
        |
        v
Canon Client (src/canon/canonClient.ts)
  Submits order via Canon CLI HTTP gateway -> Polymarket
  Falls back to dry-run if CLI unavailable or DRY_RUN=true
        |
        v
  OrderResult -> RESULTS.md + logs/trades.jsonl
```

## Module Map

| Path | Role |
|------|------|
| src/index.ts | Main polling loop (30s intervals) |
| src/model/winProbability.ts | Logistic win-probability model |
| src/data/nbaFetcher.ts | BallDontLie + ESPN live data |
| src/market/marketFetcher.ts | Market price dispatcher |
| src/market/polymarketSearch.ts | Polymarket CLOB search by team name |
| src/trading/edgeDetector.ts | Model vs market edge detection |
| src/trading/riskEngine.ts | Kelly sizing + risk limit checks |
| src/trading/positionTracker.ts | Open position state machine |
| src/trading/resultsLogger.ts | RESULTS.md append |
| src/canon/canonClient.ts | Canon CLI order submission |
| src/backtest/backtestRunner.ts | Offline backtest harness |
| src/backtest/historicalGames.ts | 5 historical playoff game fixtures |
| scripts/backtest.ts | CLI: run backtest and print accuracy |
