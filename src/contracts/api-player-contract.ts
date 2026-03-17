import { z } from "zod";

export const apiPlayerSchema = z.object({
  "Player name": z.string(),
  position: z.string(),
  Games: z.number(),
  "At-bat": z.number(),
  Runs: z.number(),
  Hits: z.number(),
  "Double (2B)": z.number(),
  "third baseman": z.number(),
  "home run": z.number(),
  "run batted in": z.number(),
  "a walk": z.number(),
  Strikeouts: z.number(),
  "stolen base": z.number(),
  "Caught stealing": z.number(),
  AVG: z.number(),
  "On-base Percentage": z.number(),
  "Slugging Percentage": z.number(),
  "On-base Plus Slugging": z.number(),
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
