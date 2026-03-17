import { generatePlayerDescription, PlayerStats } from "@/services/claude-description-generator";

const samplePlayer: PlayerStats = {
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

const playerWithNulls: PlayerStats = {
  ...samplePlayer,
  playerName: "Old Timer",
  caughtStealing: null,
  stolenBases: null,
};

describe("generatePlayerDescription", () => {
  it("calls the Claude API and returns the text response", async () => {
    const fakeClient = {
      messages: {
        create: async () => ({
          content: [{ type: "text" as const, text: "A great player profile." }],
        }),
      },
    };

    const result = await generatePlayerDescription(
      samplePlayer,
      fakeClient as never,
    );

    expect(result).toBe("A great player profile.");
  });

  it("returns fallback text when no text block is found", async () => {
    const fakeClient = {
      messages: {
        create: async () => ({
          content: [],
        }),
      },
    };

    const result = await generatePlayerDescription(
      samplePlayer,
      fakeClient as never,
    );

    expect(result).toBe("Description unavailable.");
  });

  it("handles players with null stats", async () => {
    const fakeClient = {
      messages: {
        create: async (params: { messages: { content: string }[] }) => {
          // Verify the prompt contains N/A for null values
          const userMessage = params.messages[0].content;
          expect(userMessage).toContain("N/A");
          return {
            content: [{ type: "text" as const, text: "Historic player profile." }],
          };
        },
      },
    };

    const result = await generatePlayerDescription(
      playerWithNulls,
      fakeClient as never,
    );

    expect(result).toBe("Historic player profile.");
  });
});
