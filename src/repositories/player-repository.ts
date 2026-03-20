import { prisma } from "@/lib/prisma";
import type { PlayerSortField, SortOrder } from "@/types/player";

export const playerRepository = {
  async findAll({
    page,
    pageSize,
    sortBy,
    sortOrder,
  }: {
    page: number;
    pageSize: number;
    sortBy: PlayerSortField;
    sortOrder: SortOrder;
  }) {
    const [data, total] = await Promise.all([
      prisma.player.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.player.count(),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async findById(id: string) {
    return prisma.player.findUnique({ where: { id } });
  },

  async update(id: string, data: Record<string, unknown>) {
    return prisma.player.update({ where: { id }, data });
  },

  async upsertFromApi(playerData: {
    playerName: string;
    position: string;
    [key: string]: unknown;
  }) {
    const { playerName, position, ...stats } = playerData;

    return prisma.player.upsert({
      where: { playerName_position: { playerName, position } },
      create: { playerName, position, ...stats } as Parameters<typeof prisma.player.create>[0]["data"],
      update: stats as Parameters<typeof prisma.player.update>[0]["data"],
    });
  },
};
