import { fetchPlayersFromApi } from "@/services/baseball-api-service";
import { enqueueDescriptionJob } from "@/services/queue-service";
import { prisma } from "@/lib/prisma";

type FetchFn = typeof fetchPlayersFromApi;
type EnqueueFn = (playerId: string) => Promise<void>;

export async function syncPlayers(
  fetchFn: FetchFn = fetchPlayersFromApi,
  enqueueFn: EnqueueFn = enqueueDescriptionJob,
) {
  console.log(`[CRON] Syncing players at ${new Date().toISOString()}`);

  const apiPlayers = await fetchFn();
  let synced = 0;
  let skipped = 0;

  for (const playerData of apiPlayers) {
    const existing = await prisma.player.findUnique({
      where: {
        playerName_position: {
          playerName: playerData.playerName,
          position: playerData.position,
        },
      },
    });

    if (existing?.locallyModified) {
      skipped++;
      continue;
    }

    const player = await prisma.player.upsert({
      where: {
        playerName_position: {
          playerName: playerData.playerName,
          position: playerData.position,
        },
      },
      create: playerData,
      update: playerData,
    });

    await enqueueFn(player.id);
    synced++;
  }

  console.log(`[CRON] Synced ${synced}, skipped ${skipped} locally modified`);
  return { synced, skipped };
}
