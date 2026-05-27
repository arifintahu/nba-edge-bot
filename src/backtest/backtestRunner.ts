import { replayGame } from "./gameReplay";
import { computeWinProbability } from "../model/winProbability";

export interface SnapshotResult {
  minute: number;
  secondsRemaining: number;
  homeScore: number;
  awayScore: number;
  modelHomeProb: number;
  convergedCorrectly: boolean;
}

export interface BacktestResult {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  actualWinner: "home" | "away";
  snapshots: SnapshotResult[];
  finalMinuteProb: number;
  correctAtEnd: boolean;
}

export function backtestGame(
  gameId: string,
  homeTeam: string,
  awayTeam: string,
  finalHomeScore: number,
  finalAwayScore: number
): BacktestResult {
  const actualWinner: "home" | "away" = finalHomeScore >= finalAwayScore ? "home" : "away";
  const states = replayGame(gameId, homeTeam, awayTeam, finalHomeScore, finalAwayScore);
  const snapshots: SnapshotResult[] = states.map((state, idx) => {
    const wp = computeWinProbability(state);
    const correct =
      (actualWinner === "home" && wp.homeWinProb > 0.5) ||
      (actualWinner === "away" && wp.awayWinProb > 0.5);
    return {
      minute: idx,
      secondsRemaining: state.secondsRemaining,
      homeScore: state.homeScore,
      awayScore: state.awayScore,
      modelHomeProb: wp.homeWinProb,
      convergedCorrectly: correct,
    };
  });
  const last = snapshots[snapshots.length - 1];
  return {
    gameId, homeTeam, awayTeam, actualWinner,
    snapshots,
    finalMinuteProb: last.modelHomeProb,
    correctAtEnd: last.convergedCorrectly,
  };
}
