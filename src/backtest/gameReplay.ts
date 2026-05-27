import type { GameState } from "../types";

export function replayGame(
  gameId: string,
  homeTeam: string,
  awayTeam: string,
  finalHomeScore: number,
  finalAwayScore: number
): GameState[] {
  const snapshots: GameState[] = [];
  const totalMinutes = 48;
  // minute 0 = tip-off (2880 sec remaining); minute 48 = final
  for (let minute = 0; minute <= totalMinutes; minute++) {
    const progress = minute / totalMinutes;
    const homeScore = Math.round(finalHomeScore * progress);
    const awayScore = Math.round(finalAwayScore * progress);
    const secondsRemaining = Math.max(0, (totalMinutes - minute) * 60);
    const quarter = Math.min(4, Math.floor(minute / 12) + 1);
    const possession = minute % 2 === 0 ? 1 : -1;
    snapshots.push({
      gameId,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      secondsRemaining,
      quarter,
      possession,
      timestamp: new Date(Date.now() - (totalMinutes - minute) * 60000).toISOString(),
      status: minute < totalMinutes ? "live" : "final",
    });
  }
  return snapshots;
}
