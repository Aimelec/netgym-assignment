import { prisma } from "@/lib/prisma";
import { updatePlayer } from "@/interactors/update-player";
import { NotFoundError } from "@/errors/app-error";
import { makePlayer } from "../factories/player-factory";
import "../setup-db";

const samplePlayer = makePlayer({ playerName: "Update Test Player", position: "1B" });

const enqueuedIds: string[] = [];
const fakeEnqueue = async (id: string) => { enqueuedIds.push(id); };

beforeEach(() => {
  enqueuedIds.length = 0;
});

describe("updatePlayer", () => {
  it("updates the player and marks it as locally modified", async () => {
    const player = await prisma.player.create({ data: samplePlayer });

    const updated = await updatePlayer(player.id, { hits: 150 }, fakeEnqueue);

    expect(updated.hits).toBe(150);
    expect(updated.locallyModified).toBe(true);
    expect(updated.descriptionStatus).toBe("pending");
    expect(updated.description).toBeNull();
  });

  it("enqueues a description job after update", async () => {
    const player = await prisma.player.create({ data: samplePlayer });

    await updatePlayer(player.id, { homeRuns: 35 }, fakeEnqueue);

    expect(enqueuedIds).toEqual([player.id]);
  });

  it("throws NotFoundError for non-existent player", async () => {
    await expect(
      updatePlayer("non-existent-id", { hits: 10 }, fakeEnqueue),
    ).rejects.toThrow(NotFoundError);

    expect(enqueuedIds).toHaveLength(0);
  });

  it("rejects invalid input", async () => {
    const player = await prisma.player.create({ data: samplePlayer });

    await expect(
      updatePlayer(player.id, { hits: -5 }, fakeEnqueue),
    ).rejects.toThrow();

    expect(enqueuedIds).toHaveLength(0);
  });
});
