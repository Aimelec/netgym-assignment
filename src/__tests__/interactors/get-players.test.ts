import { prisma } from "@/lib/prisma";
import { getPlayers } from "@/interactors/get-players";
import { makePlayer } from "../factories/player-factory";
import "../setup-db";

const makePlayers = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    makePlayer({
      playerName: `Player ${String(i + 1).padStart(3, "0")}`,
      hits: (count - i) * 10,
      homeRuns: i * 5,
    }),
  );

describe("getPlayers", () => {
  it("returns paginated results with default params", async () => {
    await prisma.player.createMany({ data: makePlayers(15) });

    const result = await getPlayers({});

    expect(result.data).toHaveLength(10);
    expect(result.total).toBe(15);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.totalPages).toBe(2);
  });

  it("returns second page", async () => {
    await prisma.player.createMany({ data: makePlayers(15) });

    const result = await getPlayers({ page: 2 });

    expect(result.data).toHaveLength(5);
    expect(result.page).toBe(2);
  });

  it("sorts by playerName ascending by default", async () => {
    await prisma.player.createMany({ data: makePlayers(5) });

    const result = await getPlayers({});
    const names = result.data.map((p) => p.playerName);

    expect(names).toEqual([...names].sort());
  });

  it("sorts by homeRuns ascending", async () => {
    await prisma.player.createMany({ data: makePlayers(5) });

    const result = await getPlayers({ sortBy: "homeRuns", sortOrder: "asc" });
    const hrValues = result.data.map((p) => p.homeRuns);

    expect(hrValues).toEqual([...hrValues].sort((a, b) => (a ?? 0) - (b ?? 0)));
  });

  it("rejects invalid sortBy field", async () => {
    await expect(getPlayers({ sortBy: "rbi" })).rejects.toThrow();
  });
});
