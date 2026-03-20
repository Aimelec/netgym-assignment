import { fetchPlayersFromApi } from "@/services/baseball-api-service";
import { enqueueDescriptionJob } from "@/services/queue-service";
import { hasStatsChanged } from "@/utils/player-diff";
import { prisma } from "@/lib/prisma";

type FetchFn = typeof fetchPlayersFromApi;
type EnqueueFn = (playerId: string) => Promise<void>;

export async function syncPlayers(
  fetchFn: FetchFn = fetchPlayersFromApi,
  enqueueFn: EnqueueFn = enqueueDescriptionJob,
) {
  console.log(`[CRON] Syncing players at ${new Date().toISOString()}`);

  const apiPlayers = await fetchFn();

  const existingPlayers = await prisma.player.findMany();
  const existingByName = new Map(
    existingPlayers.map((p) => [p.playerName, p]),
  );

  const toSync = apiPlayers.filter((p) => {
    const existing = existingByName.get(p.playerName);
    if (existing?.locallyModified) return false;
    if (!existing) return true;
    return hasStatsChanged(existing, p);
  });

  const skipped = apiPlayers.length - toSync.length;

  const upserted = await prisma.$transaction(
    toSync.map((p) =>
      prisma.player.upsert({
        where: { playerName: p.playerName },
        create: p,
        update: p,
      }),
    ),
  );

  await Promise.all(upserted.map((player) => enqueueFn(player.id)));

  console.log(`[CRON] Synced ${upserted.length}, skipped ${skipped} unchanged/modified`);
  return { synced: upserted.length, skipped };
}
