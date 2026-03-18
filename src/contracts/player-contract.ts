import { z } from "zod";
import { POSITIONS } from "@/types/player";

export const updatePlayerSchema = z.object({
  playerName: z.string().min(1).optional(),
  position: z.enum(POSITIONS as [string, ...string[]]).optional(),
  games: z.number().int().min(0).optional(),
  atBat: z.number().int().min(0).optional(),
  runs: z.number().int().min(0).optional(),
  hits: z.number().int().min(0).optional(),
  doubles: z.number().int().min(0).optional(),
  triples: z.number().int().min(0).optional(),
  homeRuns: z.number().int().min(0).optional(),
  rbi: z.number().int().min(0).optional(),
  walks: z.number().int().min(0).optional(),
  strikeouts: z.number().int().min(0).optional(),
  stolenBases: z.number().int().min(0).optional(),
  caughtStealing: z.number().int().min(0).optional(),
  battingAvg: z.number().min(0).optional(),
  obp: z.number().min(0).optional(),
  slg: z.number().min(0).optional(),
  ops: z.number().min(0).optional(),
});

export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;

export const getPlayersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["playerName", "hits", "homeRuns"]).default("playerName"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});
