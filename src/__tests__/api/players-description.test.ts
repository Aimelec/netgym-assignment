import { NextRequest } from "next/server";
import IORedis from "ioredis";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/players/[id]/description/route";
import "../setup-db";

function makeRequest(id: string) {
  const request = new NextRequest(
    `http://localhost:3000/api/players/${id}/description`,
  );
  const params = Promise.resolve({ id });
  return { request, params };
}

describe("GET /api/players/[id]/description", () => {
  it("returns cached description immediately without streaming", async () => {
    const player = await prisma.player.create({
      data: {
        playerName: "Cached Player",
        position: "1B",
        description: "A solid first baseman with power.",
        descriptionStatus: "ready",
      },
    });

    const { request, params } = makeRequest(player.id);
    const response = await GET(request, { params });

    expect(response.headers.get("Content-Type")).toBe("text/event-stream");

    const text = await response.text();
    const payload = JSON.parse(text.replace("data: ", "").trim());

    expect(payload.status).toBe("ready");
    expect(payload.description).toBe("A solid first baseman with power.");
  });

  it("delivers description via Redis pub/sub when status is pending", async () => {
    const player = await prisma.player.create({
      data: {
        playerName: "Pending Player",
        position: "CF",
        descriptionStatus: "pending",
      },
    });

    const { request, params } = makeRequest(player.id);
    const responsePromise = GET(request, { params });

    const publisher = new IORedis(process.env.REDIS_URL!);
    const message = JSON.stringify({ status: "ready", description: "Fleet-footed center fielder." });

    await new Promise((resolve) => setTimeout(resolve, 200));
    await publisher.publish(`player:${player.id}:description`, message);

    const response = await responsePromise;
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");

    const reader = response.body!.getReader();
    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);
    const payload = JSON.parse(text.replace("data: ", "").trim());

    expect(payload.status).toBe("ready");
    expect(payload.description).toBe("Fleet-footed center fielder.");

    publisher.disconnect();
  }, 10000);
});
