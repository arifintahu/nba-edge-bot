import type { GameState, WinProbability } from "../types";

const MODEL_VERSION = "1.0.0";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * P = sigmoid(a*scoreDiff + b*sqrt(secondsRemaining) + c*possession)
 * Coefficients hand-tuned; a=0.15, b=-0.03 (uncertainty), c=0.5 (possession)
 */
export function computeWinProbability(state: GameState): WinProbability {
  const { gameId, homeScore, awayScore, secondsRemaining, possession } = state;
  const scoreDiff = homeScore - awayScore;
  const safeSeconds = Math.max(0, secondsRemaining);
  const logit = 0.15 * scoreDiff + -0.03 * Math.sqrt(safeSeconds) + 0.5 * possession;
  const homeWinProb = sigmoid(logit);
  return {
    gameId,
    homeWinProb,
    awayWinProb: 1 - homeWinProb,
    scoreDiff,
    secondsRemaining: safeSeconds,
    modelVersion: MODEL_VERSION,
  };
}
