# Trading Results

## Simulation Performance (2026-05-29)

Full simulation across live NBA playoff game data with `DRY_RUN=true` and starting bankroll of $100 USDC.

| Metric | Value |
|--------|-------|
| Starting bankroll | $100.00 |
| Final bankroll | $157.22 |
| Total trades | 230 |
| Win rate | **79.1%** (182 / 230) |
| Total staked | $1,061.30 |
| Net P&L | **+$57.22 (+57.2%)** |
| Max open positions | 3 |
| Stop-loss triggered | No |

Strategy: logistic win-probability model vs Polymarket implied odds, edge threshold 5%, quarter-Kelly sizing.

See [SIMULATE.md](SIMULATE.md) for the full per-trade log.

---

## Live Trade Log

| Date | Game | Side | Entry | Exit | Amount | PnL | Notes |
|------|------|------|-------|------|--------|-----|-------|

*Live trades append here automatically when `DRY_RUN=false` and Canon CLI is connected.*
