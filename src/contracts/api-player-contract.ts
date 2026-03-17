import { z } from "zod";

const numericField = z.union([z.number(), z.string()]).transform((val) =>
  typeof val === "number" ? val : null,
);

export const apiPlayerSchema = z.object({
  "Player name": z.string(),
  position: z.string(),
  Games: numericField,
  "At-bat": numericField,
  Runs: numericField,
  Hits: numericField,
  "Double (2B)": numericField,
  "third baseman": numericField,
  "home run": numericField,
  "run batted in": numericField,
  "a walk": numericField,
  Strikeouts: numericField,
  "stolen base": numericField,
  "Caught stealing": numericField,
  AVG: numericField,
  "On-base Percentage": numericField,
  "Slugging Percentage": numericField,
  "On-base Plus Slugging": numericField,
});

export type ApiPlayer = z.infer<typeof apiPlayerSchema>;

export function mapApiPlayerToDb(apiPlayer: ApiPlayer) {
  return {
    playerName: apiPlayer["Player name"],
    position: apiPlayer.position,
    games: apiPlayer.Games,
    atBat: apiPlayer["At-bat"],
    runs: apiPlayer.Runs,
    hits: apiPlayer.Hits,
    doubles: apiPlayer["Double (2B)"],
    triples: apiPlayer["third baseman"],
    homeRuns: apiPlayer["home run"],
    rbi: apiPlayer["run batted in"],
    walks: apiPlayer["a walk"],
    strikeouts: apiPlayer.Strikeouts,
    stolenBases: apiPlayer["stolen base"],
    caughtStealing: apiPlayer["Caught stealing"],
    battingAvg: apiPlayer.AVG,
    obp: apiPlayer["On-base Percentage"],
    slg: apiPlayer["Slugging Percentage"],
    ops: apiPlayer["On-base Plus Slugging"],
  };
}
