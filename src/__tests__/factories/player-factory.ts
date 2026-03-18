import type { Player } from "@/types/player";

const PLAYER_DEFAULTS = {
  playerName: "Test Player",
  position: "CF",
  games: 100,
  atBat: 400,
  runs: 60,
  hits: 120,
  doubles: 25,
  triples: 5,
  homeRuns: 15,
  rbi: 55,
  walks: 40,
  strikeouts: 80,
  stolenBases: 10,
  caughtStealing: 3,
  battingAvg: 0.3,
  obp: 0.38,
  slg: 0.5,
  ops: 0.88,
};

type PlayerData = typeof PLAYER_DEFAULTS;
type StatKey = Exclude<keyof PlayerData, "playerName" | "position">;
type PlayerOverrides = Partial<Pick<PlayerData, "playerName" | "position">> &
  Partial<Record<StatKey, number | null>>;

export function makePlayer(overrides: PlayerOverrides = {}) {
  return { ...PLAYER_DEFAULTS, ...overrides };
}

export function makeDbPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "test-id",
    ...PLAYER_DEFAULTS,
    description: null,
    descriptionStatus: "pending",
    locallyModified: false,
    ...overrides,
  };
}

export function makeDbPlayerList(count: number, overrides: Partial<Player> = {}): Player[] {
  return Array.from({ length: count }, (_, i) => makeDbPlayer({
    id: `id-${i}`,
    playerName: `Player ${String.fromCharCode(65 + i)}`,
    games: 100 + i,
    hits: 120 + i * 10,
    homeRuns: 15 + i * 5,
    ...overrides,
  }));
}

export function makeApiPlayer(overrides: Record<string, unknown> = {}) {
  return {
    "Player name": "B Bonds",
    position: "LF",
    Games: 2986,
    "At-bat": 9847,
    Runs: 2227,
    Hits: 2935,
    "Double (2B)": 601,
    "third baseman": 77,
    "home run": 762,
    "run batted in": 1996,
    "a walk": 2558,
    Strikeouts: 1539,
    "stolen base": 514,
    "Caught stealing": 141,
    AVG: 0.298,
    "On-base Percentage": 0.444,
    "Slugging Percentage": 0.607,
    "On-base Plus Slugging": 1.051,
    ...overrides,
  };
}
