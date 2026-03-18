import { generatePlayerDescription, PlayerStats } from "@/services/claude-description-generator";
import { makePlayer } from "../factories/player-factory";

const samplePlayer: PlayerStats = makePlayer();
const playerWithNulls: PlayerStats = makePlayer({ playerName: "Old Timer", caughtStealing: null, stolenBases: null });

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
