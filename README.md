# nba-edge-bot

Speed-based NBA playoff prediction market bot for the DEGA NBA Playoffs Hackathon on DoraHacks.

**Strategy:** After each poll, compute a win probability from live game state and compare it to the market-implied probability. When the gap exceeds the threshold, place a Kelly-fractional-sized bet.

## Architecture

```
NBA data (BallDontLie API)
        |
Win Probability Model (logistic)
        |
Edge Detector (model prob vs market prob)
        |
Risk Engine (Kelly sizing + stop-loss)
        |
Canon CLI Executor -> Polymarket
```

## Setup

```bash
npm install
cp .env.example .env
# Fill in API keys
```

## Run

```bash
# Dry-run (no real orders):
npm run dev

# Live trading:
npm start
```

## Win Probability Model

```
P = sigmoid(0.15 * scoreDiff + (-0.03) * sqrt(secondsRemaining) + 0.5 * possession)
```

- **scoreDiff**: home minus away points
- **secondsRemaining**: total game seconds left
- **possession**: +1 home, -1 away, 0 unknown

## Config (.env)

| Variable | Default | Description |
|---|---|---|
| BALLDONTLIE_API_KEY | | BallDontLie API key |
| POLYMARKET_API_KEY | mock | Polymarket CLOB key (mock = no real trades) |
| BANKROLL | 50 | Starting USDC bankroll |
| EDGE_THRESHOLD | 0.05 | Min model-market gap to trade |
| MAX_BET_FRACTION | 0.05 | Max bet as fraction of bankroll |
| DRY_RUN | true | Set false for real orders |
| CANON_URL | http://localhost:3456 | Canon CLI gateway |

## Tests

```bash
npm test
```

## Example Log Output

```
[12:03:45] INFO  Live games: 2
[12:03:45] INFO  Celtics vs Knicks | model=67.2% market=60.0% edge=+7.2% ACTIONABLE
[12:03:45] TRADE DRY-RUN order: gameId=8231 side=home amount=1.23 USDC
```

## Submission

- **Hackathon:** DEGA NBA Playoffs Prediction Market — DoraHacks
- **Deadline:** June 1, 2026
- **Strategy:** Speed-based stats edge
- **Author:** Miftahul Arifin (@arifintahu)
