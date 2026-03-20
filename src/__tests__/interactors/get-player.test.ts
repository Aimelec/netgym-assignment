import { prisma } from "@/lib/prisma";
import { getPlayer } from "@/interactors/get-player";
import { NotFoundError } from "@/errors/app-error";
import { makePlayer } from "../factories/player-factory";
import "../setup-db";

describe("getPlayer", () => {
  it("returns the player when found", async () => {
    const created = await prisma.player.create({ data: makePlayer() });

    const player = await getPlayer(created.id);

    expect(player.id).toBe(created.id);
    expect(player.playerName).toBe(created.playerName);
    expect(player.position).toBe(created.position);
  });

  it("throws NotFoundError when player does not exist", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";

    await expect(getPlayer(fakeId)).rejects.toThrow(NotFoundError);
    await expect(getPlayer(fakeId)).rejects.toThrow(`Player with id ${fakeId} not found`);
  });
});
