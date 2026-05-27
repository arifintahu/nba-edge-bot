export interface HistoricalGame {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  finalHomeScore: number;
  finalAwayScore: number;
  date: string;
}

export const HISTORICAL_GAMES: HistoricalGame[] = [
  { gameId: "2024-p-g1", homeTeam: "Boston Celtics", awayTeam: "Miami Heat", finalHomeScore: 114, finalAwayScore: 94, date: "2024-04-21" },
  { gameId: "2024-p-g2", homeTeam: "Boston Celtics", awayTeam: "Miami Heat", finalHomeScore: 120, finalAwayScore: 95, date: "2024-04-24" },
  { gameId: "2024-p-g3", homeTeam: "New York Knicks", awayTeam: "Philadelphia 76ers", finalHomeScore: 111, finalAwayScore: 104, date: "2024-04-20" },
  { gameId: "2024-p-g4", homeTeam: "Milwaukee Bucks", awayTeam: "Indiana Pacers", finalHomeScore: 109, finalAwayScore: 94, date: "2024-04-21" },
  { gameId: "2024-p-g5", homeTeam: "Oklahoma City Thunder", awayTeam: "New Orleans Pelicans", finalHomeScore: 94, finalAwayScore: 92, date: "2024-04-21" },
];