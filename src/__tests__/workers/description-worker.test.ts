import { prisma } from "@/lib/prisma";
import { enqueueDescriptionJob } from "@/services/queue-service";
import { startDescriptionWorker } from "@/workers/description-worker";

const samplePlayer = {
  playerName: "Worker Test Player",
  position: "SS",
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
};

beforeEach(async () => {
  await prisma.player.deleteMany();
});

afterAll(async () => {
  await prisma.player.deleteMany();
  await prisma.$disconnect();
});

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
