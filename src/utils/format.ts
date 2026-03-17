export function formatFloat(value: number | null) {
  return value !== null ? value.toFixed(3) : "—";
}

export function formatStat(value: number | null) {
  return value !== null ? String(value) : "—";
}
