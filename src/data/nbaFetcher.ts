import axios from "axios";
import type { GameState } from "../types";

const BASE_URL = "https://api.balldontlie.io/v1";

function parseSecondsRemaining(status: string, period: number, time: string): number {
  if (status === "Final") return 0;
  if (!time || time === "") return 48 * 60;
  const parts = time.split(":");
  if (parts.length !== 2) return 48 * 60;
  const mins = parseInt(parts[0], 10);
  const secs = parseInt(parts[1], 10);
  const periodsLeft = Math.max(0, 4 - period);
  return periodsLeft * 12 * 60 + mins * 60 + secs;
}

function mapStatus(status: string): GameState["status"] {
  if (status === "Final") return "final";
  if (status.includes(":") || /^[0-9]/.test(status)) return "live";
  return "scheduled";
}

export async function fetchLiveGames(apiKey: string): Promise<GameState[]> {
  const today = new Date().toISOString().slice(0, 10);
  const resp = await axios.get(BASE_URL + "/games", {
    headers: { Authorization: apiKey },
    params: { dates: [today], per_page: 30 },
  });
  const games = resp.data.data as any[];
  return games.map((g: any) => ({
    gameId: String(g.id),
    homeTeam: g.home_team.full_name,
    awayTeam: g.visitor_team.full_name,
    homeScore: g.home_team_score ?? 0,
    awayScore: g.visitor_team_score ?? 0,
    secondsRemaining: parseSecondsRemaining(g.status, g.period ?? 1, g.time ?? ""),
    quarter: g.period ?? 1,
    possession: 0,
    timestamp: new Date().toISOString(),
    status: mapStatus(g.status),
  }));
}