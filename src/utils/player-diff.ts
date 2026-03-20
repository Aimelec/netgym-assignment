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

export function deduplicateByKey<T extends { playerName: string; position: string }>(
  players: T[],
): T[] {
  const seen = new Set<string>();
  return players.filter((p) => {
    const key = `${p.playerName}::${p.position}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
