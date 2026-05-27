// Shared TypeScript types for nba-edge-bot

export interface GameState {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  /** Seconds remaining in the game (0 = final) */
  secondsRemaining: number;
  /** Quarter number (1-4, 5+ = OT) */
  quarter: number;
  /** 1 = home has ball, -1 = away has ball, 0 = unknown */
  possession: number;
  /** ISO timestamp of the data snapshot */
  timestamp: string;
  status: 'live' | 'final' | 'scheduled';
}

export interface WinProbability {
  gameId: string;
  /** Probability that the home team wins (0-1) */
  homeWinProb: number;
  /** Probability that the away team wins (0-1) */
  awayWinProb: number;
  /** Score differential from home team perspective */
  scoreDiff: number;
  secondsRemaining: number;
  modelVersion: string;
}

export interface MarketPrice {
  marketId: string;
  gameId: string;
  /** Probability implied by market price for home team (0-1) */
  homeImpliedProb: number;
  /** Probability implied by market price for away team (0-1) */
  awayImpliedProb: number;
  /** Raw token price for home team outcome (0-1 USDC) */
  homePrice: number;
  /** Raw token price for away team outcome (0-1 USDC) */
  awayPrice: number;
  source: 'polymarket' | 'canon' | 'mock';
  timestamp: string;
}

export interface EdgeSignal {
  gameId: string;
  marketId: string;
  /** Which side has the edge */
  side: 'home' | 'away';
  /** Model probability for the edged side */
  modelProb: number;
  /** Market probability for the edged side */
  marketProb: number;
  /** Edge = modelProb - marketProb */
  edge: number;
  /** True if |edge| exceeds threshold */
  isActionable: boolean;
  threshold: number;
}

export interface BetSize {
  gameId: string;
  side: 'home' | 'away';
  /** Recommended bet in USDC */
  amount: number;
  /** Kelly fraction used */
  kellyFraction: number;
  /** Quarter-Kelly fraction applied */
  actualFraction: number;
  bankroll: number;
  /** Decimal odds implied by market price */
  decimalOdds: number;
  cappedByMaxBet: boolean;
  cappedByExposure: boolean;
}

export interface OrderResult {
  gameId: string;
  marketId: string;
  side: 'home' | 'away';
  amount: number;
  price: number;
  orderId?: string;
  status: 'submitted' | 'dry-run' | 'failed' | 'pending';
  errorMessage?: string;
  timestamp: string;
}

export interface TradeLogEntry {
  level: 'info' | 'warn' | 'error' | 'trade';
  timestamp: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface RiskState {
  bankroll: number;
  startingBankroll: number;
  openPositions: number;
  totalExposed: number;
  isHalted: boolean;
  haltReason?: string;
}


export interface TradeSignal {
  gameId: string;
  marketId: string;
  recommendedSide: "home" | "away";
  recommendedStake: number;
  modelHomeProb: number;
  modelAwayProb: number;
  homeMarketProb: number;
  awayMarketProb: number;
  edgeMagnitude: number;
}
export interface Config {
  ballDontLieApiKey: string;
  polymarketApiKey: string;
  bankroll: number;
  edgeThreshold: number;
  maxBetFraction: number;
  maxOpenPositions: number;
  maxExposureFraction: number;
  stopLossFraction: number;
  pollIntervalMs: number;
  dryRun: boolean;
  logPath: string;
  startingBankroll: number;
  pollIntervalSeconds: number;
  canonCliPath: string;
  walletPrivateKey: string;
  marketType: string;
}
