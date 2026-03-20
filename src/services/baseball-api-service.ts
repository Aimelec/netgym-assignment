import { apiPlayerSchema, mapApiPlayerToDb } from "@/contracts/api-player-contract";
import { deduplicateByKey } from "@/utils/player-diff";
import { z } from "zod";

const API_URL = process.env.BASEBALL_API_URL!;

export async function fetchPlayersFromApi() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch players: ${response.status}`);
  }

  const raw = await response.json();
  const parsed = z.array(apiPlayerSchema).parse(raw);

  return deduplicateByKey(parsed.map(mapApiPlayerToDb));
}
