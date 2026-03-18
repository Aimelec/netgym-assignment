import { prisma } from "@/lib/prisma";
import { processDescriptionJob } from "@/workers/description-worker";
import { makePlayer } from "../factories/player-factory";
import "../setup-db";

const samplePlayer = { ...makePlayer({ playerName: "Process Job Player" }), descriptionStatus: "pending" };

function makePublisherSpy() {
  const calls: { channel: string; message: string }[] = [];
  return {
    publish: async (channel: string, message: string) => {
      calls.push({ channel, message });
      return 1;
    },
    calls,
  };
}

describe("processDescriptionJob", () => {
  it("generates a description and persists it", async () => {
    const player = await prisma.player.create({ data: samplePlayer });
    const generateFn = async () => "Great power hitter with solid plate discipline.";
    const publisher = makePublisherSpy();

    await processDescriptionJob(player.id, generateFn, publisher);

    const updated = await prisma.player.findUnique({ where: { id: player.id } });
    expect(updated!.description).toBe("Great power hitter with solid plate discipline.");
    expect(updated!.descriptionStatus).toBe("ready");
  });

  it("publishes to the correct Redis channel with the description", async () => {
    const player = await prisma.player.create({ data: samplePlayer });
    const generateFn = async () => "Speedy outfielder.";
    const publisher = makePublisherSpy();

    await processDescriptionJob(player.id, generateFn, publisher);

    expect(publisher.calls).toHaveLength(1);
    expect(publisher.calls[0].channel).toBe(`player:${player.id}:description`);

    const payload = JSON.parse(publisher.calls[0].message);
    expect(payload.status).toBe("ready");
    expect(payload.description).toBe("Speedy outfielder.");
  });

  it("throws when the player does not exist", async () => {
    const publisher = makePublisherSpy();
    const generateFn = async () => "irrelevant";

    await expect(
      processDescriptionJob("non-existent-id", generateFn, publisher),
    ).rejects.toThrow("Player non-existent-id not found");

    expect(publisher.calls).toHaveLength(0);
  });

  it("propagates errors from the generate function", async () => {
    const player = await prisma.player.create({ data: samplePlayer });
    const publisher = makePublisherSpy();
    const failingGenerate = async () => { throw new Error("LLM API down"); };

    await expect(
      processDescriptionJob(player.id, failingGenerate, publisher),
    ).rejects.toThrow("LLM API down");

    const unchanged = await prisma.player.findUnique({ where: { id: player.id } });
    expect(unchanged!.descriptionStatus).toBe("pending");
    expect(unchanged!.description).toBeNull();
    expect(publisher.calls).toHaveLength(0);
  });
});
