export interface Player {
  id: string;
  playerName: string;
  position: string;
  games: number | null;
  atBat: number | null;
  runs: number | null;
  hits: number | null;
  doubles: number | null;
  triples: number | null;
  homeRuns: number | null;
  rbi: number | null;
  walks: number | null;
  strikeouts: number | null;
  stolenBases: number | null;
  caughtStealing: number | null;
  battingAvg: number | null;
  obp: number | null;
  slg: number | null;
  ops: number | null;
  description: string | null;
  descriptionStatus: string;
  locallyModified: boolean;
}

export type PlayerSortField = "playerName" | "hits" | "homeRuns";
export type SortOrder = "asc" | "desc";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
