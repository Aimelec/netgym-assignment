import { prisma } from "@/lib/prisma";
import { syncPlayers } from "@/cron/sync-players";
import "../setup-db";

const fakePlayers = [
  {
    playerName: "Player A",
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
  },
  {
    playerName: "Player B",
    position: "RF",
    games: 200,
    atBat: 800,
    runs: 100,
    hits: 250,
    doubles: 50,
    triples: 10,
    homeRuns: 40,
    rbi: 110,
    walks: 60,
    strikeouts: 150,
    stolenBases: 5,
    caughtStealing: 2,
    battingAvg: 0.312,
    obp: 0.4,
    slg: 0.55,
    ops: 0.95,
  },
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

    const result = await syncPlayers(fakeFetch, fakeEnqueue);

    expect(result.synced).toBe(1);
    expect(result.skipped).toBe(1);

    const afterSync = await prisma.player.findUnique({
      where: { id: playerA!.id },
    });
    expect(afterSync!.hits).toBe(9999);
    expect(afterSync!.locallyModified).toBe(true);
  });

  it("is idempotent — running twice produces the same count", async () => {
    await syncPlayers(fakeFetch, fakeEnqueue);
    const countAfterFirst = await prisma.player.count();

    await syncPlayers(fakeFetch, fakeEnqueue);
    const countAfterSecond = await prisma.player.count();

    expect(countAfterFirst).toBe(2);
    expect(countAfterSecond).toBe(2);
  });

  it("creates new players that appear in the API", async () => {
    await syncPlayers(fakeFetch, fakeEnqueue);

    const fetchWithNewPlayer = async () => [
      ...fakePlayers,
      {
        playerName: "Player C",
        position: "1B",
        games: 50,
        atBat: 200,
        runs: 30,
        hits: 60,
        doubles: 10,
        triples: 2,
        homeRuns: 8,
        rbi: 30,
        walks: 20,
        strikeouts: 40,
        stolenBases: 1,
        caughtStealing: 0,
        battingAvg: 0.3,
        obp: 0.37,
        slg: 0.48,
        ops: 0.85,
      },
    ];

    const result = await syncPlayers(fetchWithNewPlayer, fakeEnqueue);

    expect(result.synced).toBe(3);
    const count = await prisma.player.count();
    expect(count).toBe(3);
  });
});
