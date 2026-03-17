import { Queue } from "bullmq";

export const descriptionQueue = new Queue("description-generation", {
  connection: {
    url: process.env.REDIS_URL!,
    maxRetriesPerRequest: null,
  },
});

export async function enqueueDescriptionJob(playerId: string) {
  await descriptionQueue.add(
    "generate-description",
    { playerId },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    },
  );
}
