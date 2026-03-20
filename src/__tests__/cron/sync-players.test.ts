import { prisma } from "@/lib/prisma";
import { syncPlayers } from "@/cron/sync-players";
import { makePlayer } from "../factories/player-factory";
import "../setup-db";

const fakePlayers = [
  makePlayer({ playerName: "Player A" }),
  makePlayer({ playerName: "Player B", position: "RF", hits: 250, homeRuns: 40 }),
];

const fakeFetch = async () => fakePlayers;
const enqueuedIds: string[] = [];
const fakeEnqueue = async (id: string) => { enqueuedIds.push(id); };

beforeEach(() => { enqueuedIds.length = 0; });

describe("syncPlayers", () => {
  it("syncs players from the API into the database", async () => {
    const result = await syncPlayers(fakeFetch, fakeEnqueue);

    expect(result.synced).toBe(2);
    expect(result.skipped).toBe(0);
    expect(enqueuedIds).toHaveLength(2);

    const count = await prisma.player.count();
    expect(count).toBe(2);

    const playerA = await prisma.player.findFirst({
      where: { playerName: "Player A" },
    });
    expect(playerA).not.toBeNull();
    expect(playerA!.hits).toBe(120);
  });

  it("skips players marked as locally modified", async () => {
    await syncPlayers(fakeFetch, fakeEnqueue);

    const playerA = await prisma.player.findFirst({
      where: { playerName: "Player A" },
    });
    await prisma.player.update({
      where: { id: playerA!.id },
      data: { locallyModified: true, hits: 9999 },
    });
    enqueuedIds.length = 0;

    const result = await syncPlayers(fakeFetch, fakeEnqueue);

    expect(result.synced).toBe(0);
    expect(result.skipped).toBe(2);
    expect(enqueuedIds).toHaveLength(0);

    const afterSync = await prisma.player.findUnique({
      where: { id: playerA!.id },
    });
    expect(afterSync!.hits).toBe(9999);
    expect(afterSync!.locallyModified).toBe(true);
  });

  it("skips upsert and description when data is unchanged", async () => {
    await syncPlayers(fakeFetch, fakeEnqueue);
    enqueuedIds.length = 0;

    const result = await syncPlayers(fakeFetch, fakeEnqueue);

    expect(result.synced).toBe(0);
    expect(result.skipped).toBe(2);
    expect(enqueuedIds).toHaveLength(0);

    const count = await prisma.player.count();
    expect(count).toBe(2);
  });

  it("creates new players that appear in the API", async () => {
    await syncPlayers(fakeFetch, fakeEnqueue);
    enqueuedIds.length = 0;

    const fetchWithNewPlayer = async () => [
      ...fakePlayers,
      makePlayer({ playerName: "Player C", position: "1B", hits: 60, homeRuns: 8 }),
    ];

    const result = await syncPlayers(fetchWithNewPlayer, fakeEnqueue);

    expect(result.synced).toBe(1);
    expect(enqueuedIds).toHaveLength(1);
    const count = await prisma.player.count();
    expect(count).toBe(3);
  });
});
