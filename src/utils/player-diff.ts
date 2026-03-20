const STAT_FIELDS = [
  "position", "games", "atBat", "runs", "hits", "doubles", "triples",
  "homeRuns", "rbi", "walks", "strikeouts", "stolenBases", "caughtStealing",
  "battingAvg", "obp", "slg", "ops",
] as const;

export function hasStatsChanged(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): boolean {
  return STAT_FIELDS.some((field) => existing[field] !== incoming[field]);
}
