import { apiPlayerSchema, mapApiPlayerToDb } from "@/contracts/api-player-contract";

const validApiPlayer = {
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
};

describe("apiPlayerSchema", () => {
  it("validates a correct API player object", () => {
    const result = apiPlayerSchema.safeParse(validApiPlayer);
    expect(result.success).toBe(true);
  });

  it("rejects an object missing required fields", () => {
    const result = apiPlayerSchema.safeParse({
      ...validApiPlayer,
      "Player name": undefined,
    });
    expect(result.success).toBe(false);
  });

  it("coerces string values like '--' to null", () => {
    const result = apiPlayerSchema.safeParse({
      ...validApiPlayer,
      "Caught stealing": "--",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data["Caught stealing"]).toBeNull();
    }
  });

  it("rejects an object with non-string non-number types", () => {
    const result = apiPlayerSchema.safeParse({
      ...validApiPlayer,
      Games: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("mapApiPlayerToDb", () => {
  it("maps API field names to DB column names", () => {
    const mapped = mapApiPlayerToDb(validApiPlayer);

    expect(mapped.playerName).toBe("B Bonds");
    expect(mapped.position).toBe("LF");
    expect(mapped.games).toBe(2986);
    expect(mapped.atBat).toBe(9847);
    expect(mapped.runs).toBe(2227);
    expect(mapped.hits).toBe(2935);
    expect(mapped.doubles).toBe(601);
    expect(mapped.triples).toBe(77);
    expect(mapped.homeRuns).toBe(762);
    expect(mapped.rbi).toBe(1996);
    expect(mapped.walks).toBe(2558);
    expect(mapped.strikeouts).toBe(1539);
    expect(mapped.stolenBases).toBe(514);
    expect(mapped.caughtStealing).toBe(141);
    expect(mapped.battingAvg).toBe(0.298);
    expect(mapped.obp).toBe(0.444);
    expect(mapped.slg).toBe(0.607);
    expect(mapped.ops).toBe(1.051);
  });

  it("returns an object with exactly 18 fields", () => {
    const mapped = mapApiPlayerToDb(validApiPlayer);
    expect(Object.keys(mapped)).toHaveLength(18);
  });
});
