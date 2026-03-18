import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are an expert baseball analyst. Given a player's career statistics, write a detailed analytical profile (150-250 words) based ONLY on the numbers provided. Do not use any outside knowledge about the player — treat the stats as if they belong to an anonymous player. Do not start with the player's name. Structure your analysis with bold section headers using **Header** markdown syntax, separated by blank lines. Cover:
1. Offensive profile — hitter type, plate discipline based on the stats
2. Key statistical highlights — what stands out in the numbers
3. Strengths and weaknesses — what the stats reveal
4. Overall assessment — caliber of player based purely on the numbers`;

export interface PlayerStats {
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
}

function formatStat(value: number | null): string {
  return value !== null ? String(value) : "N/A";
}

function formatFloat(value: number | null): string {
  return value !== null ? value.toFixed(3) : "N/A";
}

export async function generatePlayerDescription(
  player: PlayerStats,
  client: Anthropic = new Anthropic(),
): Promise<string> {
  const stats: [string, string][] = [
    ["Player", player.playerName],
    ["Position", player.position],
    ["Games", formatStat(player.games)],
    ["At Bats", formatStat(player.atBat)],
    ["Runs", formatStat(player.runs)],
    ["Hits", formatStat(player.hits)],
    ["Doubles", formatStat(player.doubles)],
    ["Triples", formatStat(player.triples)],
    ["Home Runs", formatStat(player.homeRuns)],
    ["RBI", formatStat(player.rbi)],
    ["Walks", formatStat(player.walks)],
    ["Strikeouts", formatStat(player.strikeouts)],
    ["Stolen Bases", formatStat(player.stolenBases)],
    ["Caught Stealing", formatStat(player.caughtStealing)],
    ["AVG", formatFloat(player.battingAvg)],
    ["OBP", formatFloat(player.obp)],
    ["SLG", formatFloat(player.slg)],
    ["OPS", formatFloat(player.ops)],
  ];

  const statsText = stats.map(([label, value]) => `${label}: ${value}`).join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Write an analytical profile for this player:\n${statsText}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text ?? "Description unavailable.";
}
