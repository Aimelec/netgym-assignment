import { Worker, Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { generatePlayerDescription, PlayerStats } from "@/services/claude-description-generator";
import IORedis from "ioredis";

type GenerateFn = (player: PlayerStats) => Promise<string>;

interface Publisher {
  publish(channel: string, message: string): Promise<number>;
}

export async function processDescriptionJob(
  playerId: string,
  generateFn: GenerateFn,
  publisher: Publisher,
) {
  console.log(`[Worker] Generating description for player ${playerId}`);

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new Error(`Player ${playerId} not found`);

  const description = await generateFn(player);

  await prisma.player.update({
    where: { id: playerId },
    data: { description, descriptionStatus: "ready" },
  });

  await publisher.publish(
    `player:${playerId}:description`,
    JSON.stringify({ status: "ready", description }),
  );

  console.log(`[Worker] Description ready for ${player.playerName}`);
}

export function startDescriptionWorker(
  generateFn: GenerateFn = generatePlayerDescription,
) {
  const publisher = new IORedis(process.env.REDIS_URL!);

  const worker = new Worker(
    "description-generation",
    async (job: Job<{ playerId: string }>) => {
      await processDescriptionJob(job.data.playerId, generateFn, publisher);
    },
    {
      connection: {
        url: process.env.REDIS_URL!,
        maxRetriesPerRequest: null,
      },
      concurrency: 1,
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  return { worker, publisher };
}
