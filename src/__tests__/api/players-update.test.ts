import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PATCH } from "@/app/api/players/[id]/route";
import { makePlayer } from "../factories/player-factory";
import "../setup-db";

const samplePlayer = makePlayer({ playerName: "Patch Test Player", position: "1B" });

function makePatchRequest(id: string, body: Record<string, unknown>) {
  const request = new NextRequest("http://localhost:3000/api/players/" + id, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  const params = Promise.resolve({ id });
  return { request, params };
}

describe("PATCH /api/players/[id]", () => {
  it("updates a player and returns 200", async () => {
    const player = await prisma.player.create({ data: samplePlayer });
    const { request, params } = makePatchRequest(player.id, { hits: 200 });

    const response = await PATCH(request, { params });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.hits).toBe(200);
    expect(body.locallyModified).toBe(true);
    expect(body.descriptionStatus).toBe("pending");
  });

  it("returns 404 for non-existent player", async () => {
    const { request, params } = makePatchRequest("non-existent-id", { hits: 10 });

    const response = await PATCH(request, { params });

    expect(response.status).toBe(404);
  });

  it("returns 500 for invalid input", async () => {
    const player = await prisma.player.create({ data: samplePlayer });
    const { request, params } = makePatchRequest(player.id, { hits: -5 });

    const response = await PATCH(request, { params });

    expect(response.status).toBe(500);
  });
});
