import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { apiPlayerSchema, mapApiPlayerToDb } from "../src/contracts/api-player-contract";
import { z } from "zod";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const API_URL = process.env.BASEBALL_API_URL!;

async function main() {
  console.log("Fetching players from API...");
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch players: ${response.status}`);
  }

  const raw = await response.json();
  const parsed = z.array(apiPlayerSchema).parse(raw);
  const players = parsed.map(mapApiPlayerToDb);

  console.log(`Fetched ${players.length} players. Upserting...`);

  for (const player of players) {
    await prisma.player.upsert({
      where: {
        playerName_position: {
          playerName: player.playerName,
          position: player.position,
        },
      },
      create: player,
      update: player,
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
