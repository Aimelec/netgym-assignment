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

  const modifiedPlayers = await prisma.player.findMany({
    where: { locallyModified: true },
    select: { playerName: true, position: true },
  });
  const modifiedKeys = new Set(
    modifiedPlayers.map((p) => `${p.playerName}::${p.position}`),
  );

  const toSync = apiPlayers.filter(
    (p) => !modifiedKeys.has(`${p.playerName}::${p.position}`),
  );
  const skipped = apiPlayers.length - toSync.length;

  const upserted = await prisma.$transaction(
    toSync.map((playerData) =>
      prisma.player.upsert({
        where: {
          playerName_position: {
            playerName: playerData.playerName,
            position: playerData.position,
          },
        },
        create: playerData,
        update: playerData,
      }),
    ),
  );

  await Promise.all(upserted.map((player) => enqueueFn(player.id)));

  console.log(`[CRON] Synced ${upserted.length}, skipped ${skipped} locally modified`);
  return { synced: upserted.length, skipped };
}
