import { jest, beforeEach, describe, it, expect } from "@jest/globals";
import { fetchPlayersFromApi } from "@/services/baseball-api-service";
import { makeApiPlayer } from "../factories/player-factory";

const mockFetch = (data: unknown) =>
  jest.fn<typeof globalThis.fetch>().mockResolvedValue({
    ok: true,
    json: async () => data,
  } as Response);

beforeEach(() => { jest.restoreAllMocks(); });

describe("fetchPlayersFromApi", () => {
  it("deduplicates players with the same name and position", async () => {
    const duplicateApi = [
      makeApiPlayer({ "Player name": "D Evans", position: "3B", Hits: 100 }),
      makeApiPlayer({ "Player name": "D Evans", position: "3B", Hits: 200 }),
      makeApiPlayer({ "Player name": "D Evans", position: "RF", Hits: 150 }),
    ];
    globalThis.fetch = mockFetch(duplicateApi);

    const players = await fetchPlayersFromApi();

    expect(players).toHaveLength(2);
    expect(players[0].playerName).toBe("D Evans");
    expect(players[0].position).toBe("3B");
    expect(players[0].hits).toBe(100);
    expect(players[1].position).toBe("RF");
  });

  it("returns all players when there are no duplicates", async () => {
    const uniqueApi = [
      makeApiPlayer({ "Player name": "A Rodriguez", position: "SS" }),
      makeApiPlayer({ "Player name": "B Bonds", position: "LF" }),
    ];
    globalThis.fetch = mockFetch(uniqueApi);

    const players = await fetchPlayersFromApi();

    expect(players).toHaveLength(2);
  });

  it("throws on non-ok response", async () => {
    globalThis.fetch = jest.fn<typeof globalThis.fetch>().mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(fetchPlayersFromApi()).rejects.toThrow("Failed to fetch players: 500");
  });
});
