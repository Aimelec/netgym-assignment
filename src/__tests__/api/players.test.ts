import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/players/route";
import { makePlayer } from "../factories/player-factory";
import "../setup-db";

const samplePlayers = [
  makePlayer({ playerName: "Alpha Player", hits: 50, homeRuns: 10 }),
  makePlayer({ playerName: "Beta Player", position: "1B", hits: 150, homeRuns: 30 }),
  makePlayer({ playerName: "Charlie Player", position: "SS", hits: 100, homeRuns: 20 }),
];

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/players");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

describe("GET /api/players", () => {
  beforeEach(async () => {
    await prisma.player.createMany({ data: samplePlayers });
  });

  it("returns paginated players with 200", async () => {
    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(3);
    expect(body.total).toBe(3);
  });

  it("sorts by playerName ascending by default", async () => {
    const response = await GET(makeRequest());
    const body = await response.json();
    const names = body.data.map((p: { playerName: string }) => p.playerName);

    expect(names).toEqual(["Alpha Player", "Beta Player", "Charlie Player"]);
  });

  it("supports sorting by hits descending", async () => {
    const response = await GET(makeRequest({ sortBy: "hits", sortOrder: "desc" }));
    const body = await response.json();
    const names = body.data.map((p: { playerName: string }) => p.playerName);

    expect(names).toEqual(["Beta Player", "Charlie Player", "Alpha Player"]);
  });

  it("supports pagination", async () => {
    const response = await GET(makeRequest({ pageSize: "2", page: "2" }));
    const body = await response.json();

    expect(body.data).toHaveLength(1);
    expect(body.page).toBe(2);
    expect(body.totalPages).toBe(2);
  });

  it("returns 500 for invalid sortBy", async () => {
    const response = await GET(makeRequest({ sortBy: "invalid" }));

    expect(response.status).toBe(500);
  });
});
