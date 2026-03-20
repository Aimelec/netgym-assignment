import { playerRepository } from "@/repositories/player-repository";
import { NotFoundError } from "@/errors/app-error";

export async function getPlayer(id: string) {
  const player = await playerRepository.findById(id);
  if (!player) throw new NotFoundError("Player", id);
  return player;
}
