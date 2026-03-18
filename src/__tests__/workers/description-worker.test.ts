import { prisma } from "@/lib/prisma";
import { descriptionQueue, enqueueDescriptionJob } from "@/services/queue-service";
import { startDescriptionWorker } from "@/workers/description-worker";
import { makePlayer } from "../factories/player-factory";
import "../setup-db";

const samplePlayer = makePlayer({ playerName: "Worker Test Player", position: "SS" });

describe("description worker", () => {
  it("processes a job and updates the player description", async () => {
    const player = await prisma.player.create({
      data: { ...samplePlayer, descriptionStatus: "pending" },
    });

    const fakeGenerate = async () => "Generated description for testing.";
    const { worker, publisher } = startDescriptionWorker(fakeGenerate);

    await enqueueDescriptionJob(player.id);

    await new Promise<void>((resolve) => {
      worker.on("completed", () => resolve());
    });

    const updated = await prisma.player.findUnique({
      where: { id: player.id },
    });
    expect(updated!.description).toBe("Generated description for testing.");
    expect(updated!.descriptionStatus).toBe("ready");

    await worker.close();
    publisher.disconnect();
  }, 15000);
});

afterAll(async () => {
  await descriptionQueue.drain();
  await descriptionQueue.close();
});
