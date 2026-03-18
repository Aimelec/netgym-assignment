import { playerRepository } from "@/repositories/player-repository";
import { updatePlayerSchema } from "@/contracts/player-contract";
import { enqueueDescriptionJob } from "@/services/queue-service";
import { NotFoundError } from "@/errors/app-error";
import { DescriptionStatus } from "@/types/player";

export async function updatePlayer(
  id: string,
  input: Record<string, unknown>,
  enqueueFn: (id: string) => Promise<unknown> = enqueueDescriptionJob,
) {
  const existing = await playerRepository.findById(id);
  if (!existing) throw new NotFoundError("Player", id);

  const validated = updatePlayerSchema.parse(input);

  const updated = await playerRepository.update(id, {
    ...validated,
    locallyModified: true,
    description: null,
    descriptionStatus: DescriptionStatus.PENDING,
  });

  await enqueueFn(id);

  return updated;
}
