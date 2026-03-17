import { Worker, Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { generatePlayerDescription, PlayerStats } from "@/services/claude-description-generator";
import IORedis from "ioredis";

type GenerateFn = (player: PlayerStats) => Promise<string>;

export function startDescriptionWorker(
  generateFn: GenerateFn = generatePlayerDescription,
) {
  const publisher = new IORedis(process.env.REDIS_URL!);

  const worker = new Worker(
    "description-generation",
    async (job: Job<{ playerId: string }>) => {
      const { playerId } = job.data;
      console.log(`[Worker] Generating description for player ${playerId}`);

      const player = await prisma.player.findUnique({ where: { id: playerId } });
      if (!player) throw new Error(`Player ${playerId} not found`);

      const description = await generateFn(player);

      await prisma.player.update({
        where: { id: playerId },
        data: { description, descriptionStatus: "ready" },
      });

      // Notify SSE listeners via Redis pub/sub
      await publisher.publish(
        `player:${playerId}:description`,
        JSON.stringify({ status: "ready", description }),
      );

      console.log(`[Worker] Description ready for ${player.playerName}`);
    },
    {
      connection: {
        url: process.env.REDIS_URL!,
        maxRetriesPerRequest: null,
      },
      concurrency: 3,
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  return { worker, publisher };
}
