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
interface ESPNCompetitor {
  homeAway: string;
  team: { displayName: string };
  score?: string;
}

interface ESPNEvent {
  id: string;
  competitions: Array<{
    competitors: ESPNCompetitor[];
    status: { clock: number; displayClock: string; period: number; type: { completed: boolean; state: string } };
  }>;
}

export async function fetchLiveGamesESPN(): Promise<GameState[]> {
  const url = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";
  const resp = await axios.get(url, { timeout: 5000 });
  const events: ESPNEvent[] = resp.data.events ?? [];
  return events.map((e) => {
    const comp = e.competitions[0];
    const home = comp.competitors.find((c) => c.homeAway === "home")!;
    const away = comp.competitors.find((c) => c.homeAway === "away")!;
    const st = comp.status;
    const isCompleted = st.type.completed || st.type.state === "post";
    const isLive = !isCompleted && st.type.state === "in";
    const clockParts = (st.displayClock ?? "12:00").split(":");
    const clockSecs = (parseInt(clockParts[0] ?? "12", 10) * 60) + parseInt(clockParts[1] ?? "0", 10);
    const period = st.period ?? 1;
    const periodsLeft = Math.max(0, 4 - period);
    const secsRemaining = isCompleted ? 0 : periodsLeft * 12 * 60 + clockSecs;
    return {
      gameId: e.id,
      homeTeam: home.team.displayName,
      awayTeam: away.team.displayName,
      homeScore: parseInt(home.score ?? "0", 10),
      awayScore: parseInt(away.score ?? "0", 10),
      secondsRemaining: secsRemaining,
      quarter: period,
      possession: 0,
      timestamp: new Date().toISOString(),
      status: isCompleted ? "final" : isLive ? "live" : "scheduled",
    };
  });
}
