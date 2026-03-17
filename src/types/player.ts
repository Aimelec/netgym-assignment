export interface Player {
  id: string;
  playerName: string;
  position: string;
  games: number;
  atBat: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  walks: number;
  strikeouts: number;
  stolenBases: number;
  caughtStealing: number;
  battingAvg: number;
  obp: number;
  slg: number;
  ops: number;
}

export type PlayerSortField = "hits" | "homeRuns";
export type SortOrder = "asc" | "desc";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
