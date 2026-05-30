# Setup Guide

## Prerequisites

- Node.js ≥ 18
- A free [BallDontLie API key](https://www.balldontlie.io/) (live game data)
- Canon CLI installed and running (for live order submission)
- A funded Polymarket wallet (for live trading; not needed for dry-run)

## Installation

```bash
git clone https://github.com/arifintahu/court-edge
cd court-edge
npm install
cp .env.example .env
```

## Configuration

Edit `.env`:

```env
BALLDONTLIE_API_KEY=your_key_here
WALLET_PRIVATE_KEY=your_wallet_private_key
CANON_CLI_PATH=canon
MARKET_TYPE=mock
BANKROLL=50
EDGE_THRESHOLD=0.05
MAX_BET_FRACTION=0.05
MAX_OPEN_POSITIONS=3
MAX_EXPOSURE_FRACTION=0.10
STOP_LOSS_FRACTION=0.20
POLL_INTERVAL_MS=30000
DRY_RUN=true
```

## Canon CLI Setup

CourtEdge submits orders through Canon's CLI gateway:

```bash
canon --version
canon gateway start
```

CourtEdge auto-detects Canon availability. If Canon is not running or `DRY_RUN=true`, all orders are simulated locally — no funds at risk.

The bot writes structured state to `.canon/` for Canon's monitoring framework:
- `.canon/state.json` — live bot state (bankroll, open positions, P&L)
- `.canon/flow.json` — event stream
- `.canon/execution/<run_id>.jsonl` — per-run JSONL execution log

## Running

```bash
npm run dev          # dry-run, no real orders
npm run backtest     # offline backtest against 5 playoff games
npm run live         # live trading (requires Canon CLI + DRY_RUN=false)
```

## Tests

```bash
npm test
# 25 tests: win-prob model, edge detector, risk engine, backtest runner, position tracker
```

## Output

```
[DRY-RUN] EDGE OKC vs MIN | model=0.671 market=0.610 edge=0.061 stake=$2.47
```

Results are appended to `RESULTS.md` and `logs/trades.jsonl` in real time.
