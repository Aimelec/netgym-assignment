# Baseball App Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js app that lists baseball players from a static JSON API, generates LLM descriptions via background jobs, supports sorting/pagination, and allows editing player data.

**Architecture:** Clean Architecture with Rails-inspired layers — thin route handlers (app/), business logic (interactors/), data access (repositories/), external integrations (services/). PostgreSQL for persistence, BullMQ+Redis for background jobs, node-cron for scheduled fetching, SSE for real-time description updates.

**Tech Stack:** Next.js 15 (App Router), PostgreSQL, Prisma, BullMQ, Redis, node-cron, Claude API (Sonnet 4.6), Zod, Mantine UI, Docker Compose

**API URL:** `https://resource-hub-production.s3.us-west-2.amazonaws.com/uploads/62/baseball_data.json`

**API Data Shape (120 players):**
```json
{
  "Player name": "B Bonds",
  "position": "LF",
  "Games": 2986,
  "At-bat": 9847,
  "Runs": 2227,
  "Hits": 2935,
  "Double (2B)": 601,
  "third baseman": 77,
  "home run": 762,
  "run batted in": 1996,
  "a walk": 2558,
  "Strikeouts": 1539,
  "stolen base": 514,
  "Caught stealing": 141,
  "AVG": 0.298,
  "On-base Percentage": 0.444,
  "Slugging Percentage": 0.607,
  "On-base Plus Slugging": 1.051
}
```

**DB Column Mapping (API field → DB column):**
| API Field | DB Column |
|---|---|
| Player name | player_name |
| position | position |
| Games | games |
| At-bat | at_bat |
| Runs | runs |
| Hits | hits |
| Double (2B) | doubles |
| third baseman | triples |
| home run | home_runs |
| run batted in | rbi |
| a walk | walks |
| Strikeouts | strikeouts |
| stolen base | stolen_bases |
| Caught stealing | caught_stealing |
| AVG | batting_avg |
| On-base Percentage | obp |
| Slugging Percentage | slg |
| On-base Plus Slugging | ops |

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                          # Root layout with Mantine provider
│   ├── page.tsx                            # Redirect to /players
│   ├── players/
│   │   ├── page.tsx                        # Server Component — list + sort + paginate
│   │   └── [id]/
│   │       └── page.tsx                    # Server Component — player detail
│   ├── api/
│   │   ├── players/
│   │   │   └── route.ts                   # GET /api/players (paginated, sortable)
│   │   └── players/[id]/
│   │       ├── route.ts                   # GET + PATCH /api/players/:id
│   │       └── stream/
│   │           └── route.ts               # SSE — stream description updates
│   └── actions/
│       └── player-actions.ts              # Server Actions for edit form
│
├── interactors/
│   ├── get-players.ts                     # List with pagination + sorting
│   ├── get-player.ts                      # Single player by ID
│   └── update-player.ts                   # Update player + enqueue description regen
│
├── repositories/
│   └── player-repository.ts               # All DB queries (Prisma)
│
├── services/
│   ├── claude-service.ts                  # Claude API wrapper
│   ├── queue-service.ts                   # BullMQ queue + worker setup
│   └── baseball-api-service.ts            # Fetches + maps the static JSON
│
├── contracts/
│   ├── player-contract.ts                 # Zod schemas for API input validation
│   └── api-player-contract.ts             # Zod schema for the external API shape
│
├── cron/
│   └── sync-players.ts                    # node-cron job: fetch API → upsert → enqueue
│
├── components/
│   ├── players-table.tsx                  # Mantine Table with sort controls
│   ├── player-detail.tsx                  # Player stats + description display
│   ├── player-edit-form.tsx               # Mantine form for editing
│   └── description-status.tsx             # SSE-powered description live update
│
├── hooks/
│   └── use-description-stream.ts          # EventSource hook for SSE
│
├── lib/
│   ├── prisma.ts                          # Prisma client singleton
│   └── redis.ts                           # Redis/IORedis client singleton
│
├── errors/
│   └── app-error.ts                       # Custom error classes
│
├── workers/
│   └── description-worker.ts              # BullMQ worker process
│
└── types/
    └── player.ts                          # TypeScript interfaces
```

```
prisma/
├── schema.prisma                          # DB schema
└── seed.ts                                # One-time seed from API

docker-compose.yml                         # Postgres + Redis
Dockerfile                                 # Next.js app
.env.example                               # Template for env vars
worker.ts                                  # Entry point for BullMQ worker process
cron.ts                                    # Entry point for cron process
```

---

## Task 1: Project Scaffold + Docker + GitHub

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `docker-compose.yml`, `Dockerfile`, `.env.example`, `.env`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Create the Next.js project**

```bash
cd /Users/gabriel/Desktop/Projects/netgym-assignment
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Accept defaults. This creates the full scaffold.

- [ ] **Step 2: Install dependencies**

```bash
npm install @mantine/core @mantine/hooks @mantine/form \
  prisma @prisma/client \
  bullmq ioredis \
  node-cron \
  @anthropic-ai/sdk \
  zod \
  postcss postcss-preset-mantine

npm install -D @types/node-cron tsx tsconfig-paths
```

- [ ] **Step 3: Create `.env.example`**

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/baseball_dev

# Redis
REDIS_URL=redis://localhost:6379

# Claude API
ANTHROPIC_API_KEY=your_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
BASEBALL_API_URL=https://resource-hub-production.s3.us-west-2.amazonaws.com/uploads/62/baseball_data.json
```

- [ ] **Step 4: Create `.env` from `.env.example`**

Copy `.env.example` to `.env` and fill in the real `ANTHROPIC_API_KEY`. Add `.env` to `.gitignore` (should already be there from create-next-app).

- [ ] **Step 5: Create `docker-compose.yml`**

```yaml
version: "3.8"
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: baseball_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

- [ ] **Step 6: Create `Dockerfile`**

```dockerfile
FROM node:20-alpine AS base

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

- [ ] **Step 7: Set up Mantine in root layout**

Replace `src/app/layout.tsx`:

```tsx
import "@mantine/core/styles.css";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";

export const metadata = {
  title: "Baseball Players",
  description: "Baseball player stats and analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>{children}</MantineProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Set up PostCSS config for Mantine**

Create `postcss.config.mjs`:

```js
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "postcss-preset-mantine": {},
  },
};

export default config;
```

- [ ] **Step 9: Start Docker services and verify**

```bash
docker compose up -d
```

Run: `docker compose ps`
Expected: Both `postgres` and `redis` services running.

- [ ] **Step 10: Initialize git and create GitHub repo**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js project with Docker, Mantine, and dependencies"
gh repo create netgym-assignment --public --source=. --push
```

- [ ] **Step 11: Verify the app runs**

```bash
npm run dev
```

Visit `http://localhost:3000` — should see default Next.js page with Mantine provider.

---

## Task 2: Database Schema + Prisma Setup

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/prisma.ts`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init
```

This creates `prisma/schema.prisma` and updates `.env` with `DATABASE_URL`.

- [ ] **Step 2: Define the Player model in `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Player {
  id              String   @id @default(uuid())
  playerName      String   @map("player_name")
  position        String
  games           Int
  atBat           Int      @map("at_bat")
  runs            Int
  hits            Int
  doubles         Int
  triples         Int
  homeRuns        Int      @map("home_runs")
  rbi             Int
  walks           Int
  strikeouts      Int
  stolenBases     Int      @map("stolen_bases")
  caughtStealing  Int      @map("caught_stealing")
  battingAvg      Float    @map("batting_avg")
  obp             Float
  slg             Float
  ops             Float

  description       String?  @db.Text
  descriptionStatus String   @default("pending") @map("description_status")
  locallyModified   Boolean  @default(false) @map("locally_modified")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@unique([playerName, position])
  @@map("players")
}
```

- [ ] **Step 3: Create Prisma client singleton `src/lib/prisma.ts`**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Run migration**

```bash
npx prisma migrate dev --name init
```

Expected: Migration created successfully, `players` table exists.

- [ ] **Step 5: Verify with Prisma Studio**

```bash
npx prisma studio
```

Expected: Opens browser showing empty `Player` table with all columns.

- [ ] **Step 6: Commit**

```bash
git add prisma/ src/lib/prisma.ts
git commit -m "feat: add Player schema with Prisma and run initial migration"
```

---

## Task 3: Contracts, Types, and Repository Layer

**Files:**
- Create: `src/types/player.ts`, `src/contracts/api-player-contract.ts`, `src/contracts/player-contract.ts`, `src/repositories/player-repository.ts`, `src/errors/app-error.ts`

- [ ] **Step 1: Create TypeScript types `src/types/player.ts`**

```ts
export interface Player {
  id: string;
  playerName: string;
  position: string;
  games: number;
  atBat: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  walks: number;
  strikeouts: number;
  stolenBases: number;
  caughtStealing: number;
  battingAvg: number;
  obp: number;
  slg: number;
  ops: number;
  description: string | null;
  descriptionStatus: string;
  locallyModified: boolean;
}

export type PlayerSortField = "hits" | "homeRuns";
export type SortOrder = "asc" | "desc";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

- [ ] **Step 2: Create API player contract `src/contracts/api-player-contract.ts`**

```ts
import { z } from "zod";

export const apiPlayerSchema = z.object({
  "Player name": z.string(),
  position: z.string(),
  Games: z.number(),
  "At-bat": z.number(),
  Runs: z.number(),
  Hits: z.number(),
  "Double (2B)": z.number(),
  "third baseman": z.number(),
  "home run": z.number(),
  "run batted in": z.number(),
  "a walk": z.number(),
  Strikeouts: z.number(),
  "stolen base": z.number(),
  "Caught stealing": z.number(),
  AVG: z.number(),
  "On-base Percentage": z.number(),
  "Slugging Percentage": z.number(),
  "On-base Plus Slugging": z.number(),
});

export type ApiPlayer = z.infer<typeof apiPlayerSchema>;

export function mapApiPlayerToDb(apiPlayer: ApiPlayer) {
  return {
    playerName: apiPlayer["Player name"],
    position: apiPlayer.position,
    games: apiPlayer.Games,
    atBat: apiPlayer["At-bat"],
    runs: apiPlayer.Runs,
    hits: apiPlayer.Hits,
    doubles: apiPlayer["Double (2B)"],
    triples: apiPlayer["third baseman"],
    homeRuns: apiPlayer["home run"],
    rbi: apiPlayer["run batted in"],
    walks: apiPlayer["a walk"],
    strikeouts: apiPlayer.Strikeouts,
    stolenBases: apiPlayer["stolen base"],
    caughtStealing: apiPlayer["Caught stealing"],
    battingAvg: apiPlayer.AVG,
    obp: apiPlayer["On-base Percentage"],
    slg: apiPlayer["Slugging Percentage"],
    ops: apiPlayer["On-base Plus Slugging"],
  };
}
```

- [ ] **Step 3: Create player input contract `src/contracts/player-contract.ts`**

```ts
import { z } from "zod";

export const updatePlayerSchema = z.object({
  playerName: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
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
  battingAvg: z.number().min(0).max(1).optional(),
  obp: z.number().min(0).max(1).optional(),
  slg: z.number().min(0).optional(),
  ops: z.number().min(0).optional(),
});

export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;

export const getPlayersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["hits", "homeRuns"]).default("hits"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
```

- [ ] **Step 4: Create error classes `src/errors/app-error.ts`**

```ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 404);
    this.name = "NotFoundError";
  }
}
```

- [ ] **Step 5: Create repository `src/repositories/player-repository.ts`**

```ts
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

  async upsertFromApi(playerData: Record<string, unknown>) {
    const { playerName, position, ...stats } = playerData as {
      playerName: string;
      position: string;
      [key: string]: unknown;
    };

    return prisma.player.upsert({
      where: { playerName_position: { playerName, position } },
      create: { playerName, position, ...stats } as any,
      update: stats as any,
    });
  },

  async findPlayersNeedingDescription() {
    return prisma.player.findMany({
      where: {
        descriptionStatus: "pending",
      },
    });
  },

  async updateDescription(id: string, description: string) {
    return prisma.player.update({
      where: { id },
      data: { description, descriptionStatus: "ready" },
    });
  },

  async setDescriptionStatus(id: string, status: string) {
    return prisma.player.update({
      where: { id },
      data: { descriptionStatus: status },
    });
  },
};
```

- [ ] **Step 6: Commit**

```bash
git add src/types/ src/contracts/ src/repositories/ src/errors/
git commit -m "feat: add types, Zod contracts, repository layer, and error classes"
```

---

## Task 4: Seed Script + Baseball API Service

**Files:**
- Create: `src/services/baseball-api-service.ts`, `prisma/seed.ts`

- [ ] **Step 1: Create API service `src/services/baseball-api-service.ts`**

```ts
import { apiPlayerSchema, mapApiPlayerToDb } from "@/contracts/api-player-contract";
import { z } from "zod";

const API_URL = process.env.BASEBALL_API_URL!;

export async function fetchPlayersFromApi() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch players: ${response.status}`);
  }

  const raw = await response.json();
  const parsed = z.array(apiPlayerSchema).parse(raw);

  return parsed.map(mapApiPlayerToDb);
}
```

- [ ] **Step 2: Create seed script `prisma/seed.ts`**

```ts
import { PrismaClient } from "@prisma/client";
import { fetchPlayersFromApi } from "../src/services/baseball-api-service";

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching players from API...");
  const players = await fetchPlayersFromApi();
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
```

- [ ] **Step 3: Add seed command to `package.json`**

Add to `package.json` under the `"prisma"` key:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

- [ ] **Step 4: Run the seed**

```bash
npx prisma db seed
```

Expected: "Fetched 120 players. Upserting... Seed complete."

- [ ] **Step 5: Verify seed data**

```bash
npx prisma studio
```

Expected: 120 players in the database, all with `descriptionStatus = "pending"`, `locallyModified = false`, `description = null`.

- [ ] **Step 6: Commit**

```bash
git add src/services/baseball-api-service.ts prisma/seed.ts package.json
git commit -m "feat: add baseball API service and seed script"
```

---

## Task 5: CRON Job — Sync Players Daily

**Files:**
- Create: `src/cron/sync-players.ts`, `cron.ts`

- [ ] **Step 1: Create the sync logic `src/cron/sync-players.ts`**

```ts
import { fetchPlayersFromApi } from "@/services/baseball-api-service";
import { enqueueDescriptionJob } from "@/services/queue-service";
import { prisma } from "@/lib/prisma";

export async function syncPlayers() {
  console.log(`[CRON] Syncing players at ${new Date().toISOString()}`);

  const apiPlayers = await fetchPlayersFromApi();
  let synced = 0;
  let skipped = 0;
  let enqueued = 0;

  for (const playerData of apiPlayers) {
    const existing = await prisma.player.findUnique({
      where: {
        playerName_position: {
          playerName: playerData.playerName,
          position: playerData.position,
        },
      },
    });

    if (existing?.locallyModified) {
      skipped++;
      continue;
    }

    const needsDescription = !existing || existing.descriptionStatus === "pending";

    const upserted = await prisma.player.upsert({
      where: {
        playerName_position: {
          playerName: playerData.playerName,
          position: playerData.position,
        },
      },
      create: { ...playerData, descriptionStatus: "pending" },
      update: playerData,
    });

    if (needsDescription) {
      await enqueueDescriptionJob(upserted.id);
      enqueued++;
    }

    synced++;
  }

  console.log(`[CRON] Synced ${synced}, skipped ${skipped} locally modified, enqueued ${enqueued} for description`);
  return { synced, skipped, enqueued };
}
```

- [ ] **Step 2: Create cron entry point `cron.ts`**

```ts
import "tsconfig-paths/register";
import cron from "node-cron";
import { syncPlayers } from "./src/cron/sync-players";

console.log("[CRON] Starting cron scheduler...");

// Run every day at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    await syncPlayers();
  } catch (error) {
    console.error("[CRON] Sync failed:", error);
  }
});

// Also run once on startup for development convenience
syncPlayers().catch(console.error);
```

- [ ] **Step 3: Add cron script to `package.json`**

```json
{
  "scripts": {
    "cron": "tsx -r tsconfig-paths/register cron.ts"
  }
}
```

- [ ] **Step 4: Test the cron manually**

```bash
npm run cron
```

Expected: Logs showing "Syncing players..." and "Synced 120, skipped 0 locally modified". Then stays alive waiting for next cron tick. Kill with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add src/cron/ cron.ts package.json
git commit -m "feat: add daily cron job to sync players from API"
```

---

## Task 6: Claude Service + BullMQ Worker for Descriptions

**Files:**
- Create: `src/services/claude-service.ts`, `src/services/queue-service.ts`, `src/lib/redis.ts`, `src/workers/description-worker.ts`, `worker.ts`

- [ ] **Step 1: Create Redis client singleton `src/lib/redis.ts`**

```ts
import IORedis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: IORedis };

export const redis =
  globalForRedis.redis ?? new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
```

- [ ] **Step 2: Create Claude service `src/services/claude-service.ts`**

```ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert baseball analyst and historian. Given a player's career statistics, write a detailed analytical profile (150-250 words) including:
1. Career summary — era, position, career arc
2. Offensive profile — hitter type, plate discipline
3. Key statistical highlights — contextualized numbers
4. Comparative analysis — vs peers at their position
5. Legacy assessment — Hall of Fame caliber?`;

export async function generatePlayerDescription(player: {
  playerName: string;
  position: string;
  games: number;
  atBat: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  walks: number;
  strikeouts: number;
  stolenBases: number;
  caughtStealing: number;
  battingAvg: number;
  obp: number;
  slg: number;
  ops: number;
}): Promise<string> {
  const statsText = `
Player: ${player.playerName}
Position: ${player.position}
Games: ${player.games} | AB: ${player.atBat} | R: ${player.runs} | H: ${player.hits}
2B: ${player.doubles} | 3B: ${player.triples} | HR: ${player.homeRuns} | RBI: ${player.rbi}
BB: ${player.walks} | SO: ${player.strikeouts} | SB: ${player.stolenBases} | CS: ${player.caughtStealing}
AVG: ${player.battingAvg} | OBP: ${player.obp} | SLG: ${player.slg} | OPS: ${player.ops}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Write an analytical profile for this player:\n${statsText}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text ?? "Description unavailable.";
}
```

- [ ] **Step 3: Create queue service `src/services/queue-service.ts`**

```ts
import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

export const descriptionQueue = new Queue("description-generation", {
  connection: redis,
});

export async function enqueueDescriptionJob(playerId: string) {
  await descriptionQueue.add(
    "generate-description",
    { playerId },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    },
  );
}
```

- [ ] **Step 4: Create the worker `src/workers/description-worker.ts`**

```ts
import { Worker, Job } from "bullmq";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { generatePlayerDescription } from "@/services/claude-service";
import IORedis from "ioredis";

// Separate publisher for SSE notifications
const publisher = new IORedis(process.env.REDIS_URL!);

export function startDescriptionWorker() {
  const worker = new Worker(
    "description-generation",
    async (job: Job<{ playerId: string }>) => {
      const { playerId } = job.data;
      console.log(`[Worker] Generating description for player ${playerId}`);

      const player = await prisma.player.findUnique({ where: { id: playerId } });
      if (!player) throw new Error(`Player ${playerId} not found`);

      const description = await generatePlayerDescription(player);

      await prisma.player.update({
        where: { id: playerId },
        data: { description, descriptionStatus: "ready" },
      });

      // Notify SSE listeners via Redis pub/sub
      await publisher.publish(
        `player:${playerId}:description`,
        JSON.stringify({ status: "ready", description }),
      );

      console.log(`[Worker] Description ready for ${player.playerName}`);
    },
    {
      connection: redis,
      concurrency: 3,
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
```

- [ ] **Step 5: Create worker entry point `worker.ts`**

```ts
import "tsconfig-paths/register";
import { startDescriptionWorker } from "./src/workers/description-worker";

console.log("[Worker] Starting description worker...");
startDescriptionWorker();
```

- [ ] **Step 6: Add worker script to `package.json`**

```json
{
  "scripts": {
    "worker": "tsx -r tsconfig-paths/register worker.ts"
  }
}
```

- [ ] **Step 7: Test the worker**

In one terminal: `npm run worker`
In another: `npm run cron`

Expected: Cron syncs players, worker picks up jobs and generates descriptions. Check Prisma Studio to verify descriptions are populated.

- [ ] **Step 8: Commit**

```bash
git add src/lib/redis.ts src/services/claude-service.ts src/services/queue-service.ts \
  src/workers/ worker.ts src/cron/sync-players.ts package.json
git commit -m "feat: add Claude description generation with BullMQ worker and Redis pub/sub"
```

---

## Task 7: Interactors (Business Logic)

**Files:**
- Create: `src/interactors/get-players.ts`, `src/interactors/get-player.ts`, `src/interactors/update-player.ts`

- [ ] **Step 1: Create `src/interactors/get-players.ts`**

```ts
import { playerRepository } from "@/repositories/player-repository";
import { getPlayersQuerySchema } from "@/contracts/player-contract";

export async function getPlayers(params: Record<string, unknown>) {
  const { page, pageSize, sortBy, sortOrder } = getPlayersQuerySchema.parse(params);
  return playerRepository.findAll({ page, pageSize, sortBy, sortOrder });
}
```

- [ ] **Step 2: Create `src/interactors/get-player.ts`**

```ts
import { playerRepository } from "@/repositories/player-repository";
import { NotFoundError } from "@/errors/app-error";

export async function getPlayer(id: string) {
  const player = await playerRepository.findById(id);
  if (!player) throw new NotFoundError("Player", id);
  return player;
}
```

- [ ] **Step 3: Create `src/interactors/update-player.ts`**

```ts
import { playerRepository } from "@/repositories/player-repository";
import { updatePlayerSchema } from "@/contracts/player-contract";
import { enqueueDescriptionJob } from "@/services/queue-service";
import { NotFoundError } from "@/errors/app-error";

export async function updatePlayer(id: string, input: Record<string, unknown>) {
  const existing = await playerRepository.findById(id);
  if (!existing) throw new NotFoundError("Player", id);

  const validated = updatePlayerSchema.parse(input);

  const updated = await playerRepository.update(id, {
    ...validated,
    locallyModified: true,
    description: null,
    descriptionStatus: "pending",
  });

  await enqueueDescriptionJob(id);

  return updated;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/interactors/
git commit -m "feat: add interactors for get-players, get-player, and update-player"
```

---

## Task 8: API Routes

**Files:**
- Create: `src/app/api/players/route.ts`, `src/app/api/players/[id]/route.ts`, `src/app/api/players/[id]/stream/route.ts`

- [ ] **Step 1: Create `src/app/api/players/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getPlayers } from "@/interactors/get-players";

export async function GET(request: NextRequest) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);

  try {
    const result = await getPlayers(searchParams);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as any).statusCode });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create `src/app/api/players/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getPlayer } from "@/interactors/get-player";
import { updatePlayer } from "@/interactors/update-player";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const player = await getPlayer(id);
    return NextResponse.json(player);
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as any).statusCode });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const player = await updatePlayer(id, body);
    return NextResponse.json(player);
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as any).statusCode });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create SSE route `src/app/api/players/[id]/stream/route.ts`**

```ts
import { NextRequest } from "next/server";
import IORedis from "ioredis";
import { prisma } from "@/lib/prisma";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // If description is already ready, return it immediately (avoids race condition)
  const player = await prisma.player.findUnique({ where: { id } });
  if (player?.descriptionStatus === "ready" && player.description) {
    const encoder = new TextEncoder();
    const body = encoder.encode(
      `data: ${JSON.stringify({ status: "ready", description: player.description })}\n\n`,
    );
    return new Response(body, { headers: SSE_HEADERS });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const subscriber = new IORedis(process.env.REDIS_URL!);
      const channel = `player:${id}:description`;
      let closed = false;

      function cleanup() {
        if (closed) return;
        closed = true;
        subscriber.unsubscribe(channel);
        subscriber.disconnect();
        controller.close();
      }

      await subscriber.subscribe(channel);

      subscriber.on("message", (_ch: string, message: string) => {
        controller.enqueue(new TextEncoder().encode(`data: ${message}\n\n`));
        cleanup();
      });

      request.signal.addEventListener("abort", cleanup);

      // Timeout after 60s to avoid indefinite hanging
      setTimeout(cleanup, 60_000);
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/
git commit -m "feat: add API routes for players list, detail, update, and SSE stream"
```

---

## Task 9: Frontend — Players List Page (Mantine)

**Files:**
- Create: `src/components/players-table.tsx`, `src/app/players/page.tsx`, update `src/app/page.tsx`

- [ ] **Step 1: Create `src/components/players-table.tsx`**

```tsx
"use client";

import { Table, Pagination, Group, Select, Text, Anchor, Badge } from "@mantine/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { Player } from "@/types/player";

interface Props {
  players: Player[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sortBy: string;
  sortOrder: string;
}

export function PlayersTable({
  players,
  total,
  page,
  pageSize,
  totalPages,
  sortBy,
  sortOrder,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => params.set(key, value));
    startTransition(() => {
      router.push(`/players?${params.toString()}`);
    });
  }

  return (
    <div style={{ opacity: isPending ? 0.6 : 1, transition: "opacity 0.2s" }}>
      <Group mb="md" justify="space-between">
        <Text size="sm" c="dimmed">
          {total} players total
        </Text>
        <Group>
          <Select
            label="Sort by"
            size="xs"
            value={sortBy}
            data={[
              { value: "hits", label: "Hits" },
              { value: "homeRuns", label: "Home Runs" },
            ]}
            onChange={(value) => value && updateParams({ sortBy: value, page: "1" })}
          />
          <Select
            label="Order"
            size="xs"
            value={sortOrder}
            data={[
              { value: "desc", label: "Descending" },
              { value: "asc", label: "Ascending" },
            ]}
            onChange={(value) => value && updateParams({ sortOrder: value, page: "1" })}
          />
        </Group>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Pos</Table.Th>
            <Table.Th>G</Table.Th>
            <Table.Th>H</Table.Th>
            <Table.Th>HR</Table.Th>
            <Table.Th>AVG</Table.Th>
            <Table.Th>OPS</Table.Th>
            <Table.Th>Description</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {players.map((player) => (
            <Table.Tr key={player.id}>
              <Table.Td>
                <Anchor href={`/players/${player.id}`} size="sm">
                  {player.playerName}
                </Anchor>
              </Table.Td>
              <Table.Td>{player.position}</Table.Td>
              <Table.Td>{player.games}</Table.Td>
              <Table.Td>{player.hits}</Table.Td>
              <Table.Td>{player.homeRuns}</Table.Td>
              <Table.Td>{player.battingAvg.toFixed(3)}</Table.Td>
              <Table.Td>{player.ops.toFixed(3)}</Table.Td>
              <Table.Td>
                <Badge
                  size="xs"
                  color={
                    player.descriptionStatus === "ready"
                      ? "green"
                      : player.descriptionStatus === "pending"
                        ? "yellow"
                        : "red"
                  }
                >
                  {player.descriptionStatus}
                </Badge>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Group justify="center" mt="md">
        <Pagination
          total={totalPages}
          value={page}
          onChange={(p) => updateParams({ page: String(p) })}
        />
      </Group>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/players/page.tsx`**

```tsx
import { Container, Title } from "@mantine/core";
import { getPlayers } from "@/interactors/get-players";
import { PlayersTable } from "@/components/players-table";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PlayersPage({ searchParams }: Props) {
  const params = await searchParams;

  const flatParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") flatParams[key] = value;
  }

  const result = await getPlayers(flatParams);

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="lg">
        Baseball Players
      </Title>
      <PlayersTable
        players={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        sortBy={flatParams.sortBy ?? "hits"}
        sortOrder={flatParams.sortOrder ?? "desc"}
      />
    </Container>
  );
}
```

- [ ] **Step 3: Update `src/app/page.tsx` to redirect**

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/players");
}
```

- [ ] **Step 4: Verify the list page**

```bash
npm run dev
```

Visit `http://localhost:3000/players`. Expected: Table with 120 players, pagination, sort controls working.

- [ ] **Step 5: Commit**

```bash
git add src/components/players-table.tsx src/app/players/page.tsx src/app/page.tsx
git commit -m "feat: add players list page with Mantine table, sorting, and pagination"
```

---

## Task 10: Frontend — Player Detail Page

**Files:**
- Create: `src/components/player-detail.tsx`, `src/components/description-status.tsx`, `src/hooks/use-description-stream.ts`, `src/app/players/[id]/page.tsx`

- [ ] **Step 1: Create SSE hook `src/hooks/use-description-stream.ts`**

```tsx
"use client";

import { useEffect, useState } from "react";

export function useDescriptionStream(playerId: string, enabled: boolean) {
  const [description, setDescription] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "ready">("idle");

  useEffect(() => {
    if (!enabled) return;
    setStatus("pending");

    const eventSource = new EventSource(`/api/players/${playerId}/stream`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setDescription(data.description);
      setStatus("ready");
      eventSource.close();
    };

    eventSource.onerror = () => {
      eventSource.close();
      setStatus("idle");
    };

    return () => eventSource.close();
  }, [playerId, enabled]);

  return { description, status };
}
```

- [ ] **Step 2: Create `src/components/description-status.tsx`**

```tsx
"use client";

import { Text, Loader, Paper } from "@mantine/core";
import { useDescriptionStream } from "@/hooks/use-description-stream";

interface Props {
  playerId: string;
  initialDescription: string | null;
  initialStatus: string;
}

export function DescriptionStatus({ playerId, initialDescription, initialStatus }: Props) {
  const { description, status } = useDescriptionStream(
    playerId,
    initialStatus === "pending",
  );

  const displayDescription = description ?? initialDescription;
  const isPending = status === "pending" || initialStatus === "pending";

  if (isPending && !displayDescription) {
    return (
      <Paper p="md" withBorder>
        <Loader size="sm" mr="sm" />
        <Text component="span" size="sm" c="dimmed">
          Generating AI description...
        </Text>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder>
      <Text size="sm">{displayDescription ?? "No description available."}</Text>
    </Paper>
  );
}
```

- [ ] **Step 3: Create `src/components/player-detail.tsx`**

```tsx
import { Card, Grid, Text, Title, Badge, Group } from "@mantine/core";
import type { Player } from "@/types/player";

interface Props {
  player: Player;
}

const statLabels: { key: keyof Player; label: string }[] = [
  { key: "games", label: "Games" },
  { key: "atBat", label: "At Bats" },
  { key: "runs", label: "Runs" },
  { key: "hits", label: "Hits" },
  { key: "doubles", label: "Doubles" },
  { key: "triples", label: "Triples" },
  { key: "homeRuns", label: "Home Runs" },
  { key: "rbi", label: "RBI" },
  { key: "walks", label: "Walks" },
  { key: "strikeouts", label: "Strikeouts" },
  { key: "stolenBases", label: "Stolen Bases" },
  { key: "caughtStealing", label: "Caught Stealing" },
  { key: "battingAvg", label: "AVG" },
  { key: "obp", label: "OBP" },
  { key: "slg", label: "SLG" },
  { key: "ops", label: "OPS" },
];

export function PlayerDetail({ player }: Props) {
  return (
    <Card withBorder>
      <Group justify="space-between" mb="md">
        <div>
          <Title order={2}>{player.playerName}</Title>
          <Text c="dimmed">{player.position}</Text>
        </div>
        {player.locallyModified && (
          <Badge color="blue" variant="light">
            Modified
          </Badge>
        )}
      </Group>

      <Grid>
        {statLabels.map(({ key, label }) => (
          <Grid.Col span={3} key={key}>
            <Text size="xs" c="dimmed">
              {label}
            </Text>
            <Text fw={600}>
              {typeof player[key] === "number" && (key === "battingAvg" || key === "obp" || key === "slg" || key === "ops")
                ? (player[key] as number).toFixed(3)
                : String(player[key])}
            </Text>
          </Grid.Col>
        ))}
      </Grid>
    </Card>
  );
}
```

- [ ] **Step 4: Create `src/app/players/[id]/page.tsx`**

```tsx
import { Container, Anchor, Group, Title, Stack } from "@mantine/core";
import { getPlayer } from "@/interactors/get-player";
import { PlayerDetail } from "@/components/player-detail";
import { DescriptionStatus } from "@/components/description-status";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlayerPage({ params }: Props) {
  const { id } = await params;

  let player;
  try {
    player = await getPlayer(id);
  } catch {
    notFound();
  }

  return (
    <Container size="md" py="xl">
      <Group mb="lg">
        <Anchor href="/players" size="sm">
          ← Back to list
        </Anchor>
      </Group>

      <Stack gap="lg">
        <PlayerDetail player={player} />

        <div>
          <Title order={4} mb="sm">
            AI Analysis
          </Title>
          <DescriptionStatus
            playerId={player.id}
            initialDescription={player.description}
            initialStatus={player.descriptionStatus}
          />
        </div>
      </Stack>
    </Container>
  );
}
```

- [ ] **Step 5: Verify detail page**

Visit `http://localhost:3000/players` → click a player name. Expected: Stats card + AI description (or loading state if pending).

- [ ] **Step 6: Commit**

```bash
git add src/hooks/ src/components/player-detail.tsx src/components/description-status.tsx \
  src/app/players/\[id\]/page.tsx
git commit -m "feat: add player detail page with SSE-powered description updates"
```

---

## Task 11: Frontend — Edit Player

**Files:**
- Create: `src/components/player-edit-form.tsx`, `src/app/actions/player-actions.ts`, update `src/app/players/[id]/page.tsx`

- [ ] **Step 1: Create Server Action `src/app/actions/player-actions.ts`**

```ts
"use server";

import { updatePlayer } from "@/interactors/update-player";
import { revalidatePath } from "next/cache";

export async function updatePlayerAction(id: string, formData: Record<string, unknown>) {
  const player = await updatePlayer(id, formData);
  revalidatePath("/players");
  revalidatePath(`/players/${id}`);
  return player;
}
```

- [ ] **Step 2: Create `src/components/player-edit-form.tsx`**

```tsx
"use client";

import { useForm } from "@mantine/form";
import { NumberInput, TextInput, Button, Group, Stack, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updatePlayerAction } from "@/app/actions/player-actions";
import type { Player } from "@/types/player";

interface Props {
  player: Player;
}

export function PlayerEditForm({ player }: Props) {
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm({
    initialValues: {
      playerName: player.playerName,
      position: player.position,
      games: player.games,
      atBat: player.atBat,
      runs: player.runs,
      hits: player.hits,
      doubles: player.doubles,
      triples: player.triples,
      homeRuns: player.homeRuns,
      rbi: player.rbi,
      walks: player.walks,
      strikeouts: player.strikeouts,
      stolenBases: player.stolenBases,
      caughtStealing: player.caughtStealing,
      battingAvg: player.battingAvg,
      obp: player.obp,
      slg: player.slg,
      ops: player.ops,
    },
  });

  async function handleSubmit(values: typeof form.values) {
    setLoading(true);
    try {
      await updatePlayerAction(player.id, values);
      close();
      router.refresh();
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={open} variant="light">
        Edit Player
      </Button>

      <Modal opened={opened} onClose={close} title="Edit Player" size="lg">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <Group grow>
              <TextInput label="Name" {...form.getInputProps("playerName")} />
              <TextInput label="Position" {...form.getInputProps("position")} />
            </Group>
            <Group grow>
              <NumberInput label="Games" {...form.getInputProps("games")} />
              <NumberInput label="At Bats" {...form.getInputProps("atBat")} />
              <NumberInput label="Runs" {...form.getInputProps("runs")} />
            </Group>
            <Group grow>
              <NumberInput label="Hits" {...form.getInputProps("hits")} />
              <NumberInput label="Doubles" {...form.getInputProps("doubles")} />
              <NumberInput label="Triples" {...form.getInputProps("triples")} />
            </Group>
            <Group grow>
              <NumberInput label="Home Runs" {...form.getInputProps("homeRuns")} />
              <NumberInput label="RBI" {...form.getInputProps("rbi")} />
              <NumberInput label="Walks" {...form.getInputProps("walks")} />
            </Group>
            <Group grow>
              <NumberInput label="Strikeouts" {...form.getInputProps("strikeouts")} />
              <NumberInput label="Stolen Bases" {...form.getInputProps("stolenBases")} />
              <NumberInput label="Caught Stealing" {...form.getInputProps("caughtStealing")} />
            </Group>
            <Group grow>
              <NumberInput label="AVG" step={0.001} decimalScale={3} {...form.getInputProps("battingAvg")} />
              <NumberInput label="OBP" step={0.001} decimalScale={3} {...form.getInputProps("obp")} />
              <NumberInput label="SLG" step={0.001} decimalScale={3} {...form.getInputProps("slg")} />
              <NumberInput label="OPS" step={0.001} decimalScale={3} {...form.getInputProps("ops")} />
            </Group>

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Save Changes
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
```

- [ ] **Step 3: Add edit button to player detail page**

Update `src/app/players/[id]/page.tsx` — add the edit form below the description:

Add import:
```tsx
import { PlayerEditForm } from "@/components/player-edit-form";
```

Add after the `DescriptionStatus` block:
```tsx
<PlayerEditForm player={player} />
```

- [ ] **Step 4: Verify the edit flow**

1. Visit a player detail page
2. Click "Edit Player"
3. Change a stat value
4. Click "Save Changes"
5. Expected: Modal closes, page refreshes, description shows "pending" → SSE delivers new description

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/ src/components/player-edit-form.tsx src/app/players/\[id\]/page.tsx
git commit -m "feat: add player edit form with Server Action and description regeneration"
```

---

## Task 12: Final Polish + Docker App Service

**Files:**
- Update: `docker-compose.yml`, `package.json`

- [ ] **Step 1: Add app, worker, and cron services to `docker-compose.yml`**

```yaml
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - postgres
      - redis

  worker:
    build: .
    command: ["npx", "tsx", "-r", "tsconfig-paths/register", "worker.ts"]
    env_file: .env
    depends_on:
      - postgres
      - redis

  cron:
    build: .
    command: ["npx", "tsx", "-r", "tsconfig-paths/register", "cron.ts"]
    env_file: .env
    depends_on:
      - postgres
      - redis
```

- [ ] **Step 2: Update `.env` DATABASE_URL and REDIS_URL for Docker networking**

For Docker, the hosts change from `localhost` to service names. Add a note in `.env.example`:

```env
# For Docker Compose, use service names:
# DATABASE_URL=postgresql://postgres:postgres@postgres:5432/baseball_dev
# REDIS_URL=redis://redis:6379
```

- [ ] **Step 3: Test full Docker setup**

```bash
docker compose up --build
```

Expected: All services start. Visit `http://localhost:3000/players` — players listed, descriptions generating.

- [ ] **Step 4: Final commit**

```bash
git add docker-compose.yml .env.example
git commit -m "feat: add Docker Compose services for app, worker, and cron"
git push
```

---

## Running the App (README commands)

```bash
# Start infrastructure
docker compose up -d postgres redis

# Run migrations + seed
npx prisma migrate dev
npx prisma db seed

# Start all processes (3 terminals)
npm run dev      # Next.js app on :3000
npm run worker   # BullMQ description worker
npm run cron     # Daily player sync
```
