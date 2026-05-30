<p align="center">
  <img src="logo.svg" alt="CourtEdge" width="480"/>
</p>

# CourtEdge

Speed-based NBA playoff prediction market bot for the **DEGA NBA Playoffs Hackathon** on DoraHacks.

**Hackathon:** [DEGA NBA Playoffs Prediction Market](https://dorahacks.io/hackathon/nba-prediction-market/detail) | **Deadline:** June 1, 2026  
**Demo:** [YouTube](https://youtu.be/rvPqKRYJDIU) | **Submission:** [DoraHacks #44084](https://dorahacks.io/buidl/44084)

---

## Performance (Simulation)

| Metric | Value |
|--------|-------|
| Starting bankroll | $100 USDC |
| Final bankroll | $157.22 |
| Net P&L | **+57.2%** |
| Win rate | **79.1%** (182/230 trades) |
| Stop-loss triggered | No |

See [RESULTS.md](RESULTS.md) for the full breakdown and [SIMULATE.md](SIMULATE.md) for the per-trade log.

---

## Strategy

After each 30-second poll, the bot computes a win probability from live game state and compares it to the Polymarket-implied probability. When the gap exceeds the threshold (default 5%), it places a Kelly-fractional-sized bet via Canon CLI.

```
Win Probability Model:
P = sigmoid(0.15 * scoreDiff - 0.03 * sqrt(secondsRemaining) + 0.5 * possession)

Kelly Sizing:
f* = (P * B - (1 - P)) / B   (B = decimal odds - 1)
bet = bankroll * f* * 0.25    (quarter-Kelly for safety)
```

**The edge:** Polymarket prices lag real-time game state. A model watching every possession detects mispricings seconds before the crowd — and trades them before the window closes.

---

## Canon Integration

CourtEdge uses Canon as its order execution and state management layer:

| What | How |
|------|-----|
| **Order submission** | `src/canon/canonClient.ts` — calls `canon order --market ... --side ... --amount ... --key ...` via Canon CLI gateway |
| **State reporting** | `src/canon/canonStateWriter.ts` — writes `.canon/state.json` (bankroll, P&L, positions) after every tick |
| **Execution log** | `.canon/execution/<run_id>.jsonl` — structured JSONL per run, queryable by Canon's monitoring stack |
| **Event stream** | `.canon/flow.json` — append-only event log (init, trade, tick, halt) |

Canon CLI availability is checked at startup. If not available or `DRY_RUN=true`, all orders are simulated locally — no funds at risk.

---

## Architecture

```
NBA data (BallDontLie + ESPN fallback)
        |
Win Probability Model (logistic regression)
        |
Edge Detector (model prob vs Polymarket market prob)
        |
Risk Engine (Kelly sizing + stop-loss guard)
        |
Canon Client -> Polymarket (or dry-run)
        |
RESULTS.md + logs/trades.jsonl + .canon/
```

See [docs/architecture.md](docs/architecture.md) for the full module map.

---

## Quick Start

```bash
git clone https://github.com/arifintahu/court-edge
cd court-edge
npm install
cp .env.example .env
# Edit .env — set BALLDONTLIE_API_KEY, DRY_RUN=true for testing

# Dry-run (no real orders):
npm run dev

# Backtest win-prob model against historical games:
npm run backtest

# Live trading (requires funded wallet + Canon CLI running):
npm run live
```

See [docs/setup.md](docs/setup.md) for wallet setup and Canon CLI installation.

---

## Configuration

| Variable | Default | Description |
|---|---|---|
| BALLDONTLIE_API_KEY | | BallDontLie API key (free tier works) |
| POLYMARKET_API_KEY | | Polymarket CLOB API key |
| BANKROLL | 50 | Starting USDC bankroll |
| EDGE_THRESHOLD | 0.05 | Min model-market gap to trade (5%) |
| MAX_BET_FRACTION | 0.05 | Max bet as fraction of bankroll (5%) |
| MAX_OPEN_POSITIONS | 3 | Max simultaneous open bets |
| MAX_EXPOSURE_FRACTION | 0.10 | Max total exposure as fraction of bankroll |
| STOP_LOSS_FRACTION | 0.20 | Halt if bankroll drops by this fraction |
| POLL_INTERVAL_MS | 30000 | How often to poll (ms) |
| DRY_RUN | true | Set false for real orders |
| CANON_CLI_PATH | canon | Path to Canon CLI binary |
| WALLET_PRIVATE_KEY | | Wallet key for order signing |
| MARKET_TYPE | mock | polymarket / mock |

---

## Example Output

```
{"level":"trade","timestamp":"2026-05-30T02:14:33.121Z","message":"Order","data":{"gameId":"1","marketId":"0xabc","side":"home","amount":2.47,"price":0.61,"orderId":"dry-1717027473121","status":"dry-run"}}
[02:14:33] TRADE Order
[DRY-RUN] EDGE OKC vs MIN | model=0.671 market=0.610 edge=0.061 stake=$2.47
```

---

## Tests

```bash
npm test
# 25 tests across win-prob model, edge detector, risk engine, backtest runner, position tracker
```

---

## License

MIT — built for the DEGA NBA Playoffs Prediction Market Hackathon by [@arifintahu](https://github.com/arifintahu)
