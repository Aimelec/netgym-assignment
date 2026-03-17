import { playerRepository } from "@/repositories/player-repository";
import { getPlayersQuerySchema } from "@/contracts/player-contract";

export async function getPlayers(params: Record<string, unknown>) {
  const { page, pageSize, sortBy, sortOrder } =
    getPlayersQuerySchema.parse(params);
  return playerRepository.findAll({ page, pageSize, sortBy, sortOrder });
}
