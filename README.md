# Baseball Player Stats Manager

A full-stack Next.js application that fetches baseball player statistics from an external API, generates AI-powered analytical profiles using Claude, and provides a real-time UI for browsing and editing player data.

## Prerequisites

- Node.js 20+
- Docker and Docker Compose (for PostgreSQL and Redis)
- An [Anthropic API key](https://console.anthropic.com/) for Claude description generation

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start infrastructure

```bash
docker compose up -d postgres redis
```

This starts PostgreSQL (port 5432) and Redis (port 6379).

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in your `ANTHROPIC_API_KEY`. The defaults work with the Docker setup:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/baseball_dev
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=your_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
BASEBALL_API_URL=https://resource-hub-production.s3.us-west-2.amazonaws.com/uploads/62/baseball_data.json
```

### 4. Set up the database

```bash
npx prisma migrate deploy
```

### 5. Seed the database

Fetches players from the external API, inserts them, and enqueues description generation jobs:

```bash
npx prisma db seed
```

### 6. Start the application

You need three processes running:

```bash
# Terminal 1 — Next.js dev server (port 3005)
npm run dev

# Terminal 2 — BullMQ worker (processes description generation jobs)
npm run worker

# Terminal 3 — Cron scheduler (daily player sync)
npm run cron
```

Open http://localhost:3005 in your browser.

### Prisma Studio

Browse and edit the database directly:

```bash
npx prisma studio
```

Opens at http://localhost:5555.

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js dev server on port 3005 |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type-check without emitting files |
| `npm test` | Run all tests (backend + frontend) |
| `npm run test:backend` | Run backend tests only (Node environment) |
| `npm run test:frontend` | Run frontend tests only (jsdom environment) |
| `npm run worker` | Start the BullMQ description generation worker |
| `npm run cron` | Start the cron scheduler for daily API sync |
| `npx prisma db seed` | Seed database from external API |
| `npx prisma studio` | Open Prisma Studio database browser |
| `npx prisma migrate deploy` | Apply pending migrations |

## Architecture

### Layered Backend

The backend follows a layered architecture where each layer has a single responsibility:

```
Server Components / Route Handlers
        │
        ▼
   Interactors          ← Business logic and orchestration
        │
        ▼
   Repositories         ← Data access (Prisma queries)
        │
        ▼
   PostgreSQL
```

**Interactors** (`src/interactors/`) contain the business logic. They validate input, coordinate between repositories and services, and throw domain errors. Examples: `getPlayers`, `getPlayer`, `updatePlayer`.

**Repositories** (`src/repositories/`) are the only layer that talks to Prisma. They expose query methods and handle database-specific concerns like pagination and sorting.

**Services** (`src/services/`) integrate with external systems:
- `baseball-api-service` — fetches and deduplicates player data from the external API
- `claude-description-generator` — calls the Anthropic API to generate analytical player profiles
- `queue-service` — enqueues BullMQ jobs for async processing

**Contracts** (`src/contracts/`) define Zod schemas for validating data at system boundaries — the external API response format and the player update payload.

### Server-Side Rendering

Player list and detail pages are **server components** that call interactors directly during rendering. No API routes are needed for read operations — the data flows from Prisma to the page in a single server-side request.

The only API routes are:
- `PATCH /api/players/[id]` — client-side form submission for editing a player
- `GET /api/players/[id]/description` — SSE stream for real-time description updates

### Real-Time Descriptions (SSE + Redis Pub/Sub)

When a player is created or updated, a description generation job is enqueued to BullMQ. The flow:

```
Player created/updated
        │
        ▼
BullMQ job enqueued ──► Worker picks up job
                              │
                              ▼
                        Claude API generates
                        analytical profile
                              │
                              ▼
                        Worker saves description
                        to database
                              │
                              ▼
                        Worker publishes to
                        Redis channel
                              │
                              ▼
                        SSE endpoint pushes
                        to connected client
                              │
                              ▼
                        UI updates in real-time
```

The SSE endpoint (`/api/players/[id]/description`) subscribes to a Redis pub/sub channel for the specific player. If the description is already available, it returns it immediately and closes. Otherwise, it waits up to 60 seconds for the worker to publish the result.

On the client side, the `useDescriptionStream` hook connects via `EventSource` and updates the UI when the description arrives.

### Background Processing

**Worker** (`npm run worker`) — runs continuously, processing `description-generation` jobs from the BullMQ queue. Each job:
1. Fetches the player from the database
2. Sends stats to Claude Haiku 4.5 for analysis
3. Saves the generated description and sets `descriptionStatus: ready`
4. Publishes the result to the Redis channel for SSE clients

Jobs retry up to 3 times with exponential backoff (5s base delay) on failure.

**Cron** (`npm run cron`) — runs `syncPlayers` daily at midnight UTC (and once on startup):
1. Fetches all players from the external API
2. Deduplicates entries with the same name and position
3. Compares against existing database records
4. Skips players marked as `locallyModified` (edited by users)
5. Skips players whose stats haven't changed (avoids unnecessary writes and re-generation)
6. Upserts changed/new players in a single transaction
7. Enqueues description generation for all upserted players

### Data Model

The `Player` model uses a composite unique constraint on `(playerName, position)` since the external API contains different players with the same name at different positions.

Key fields:
- **Stats**: games, atBat, runs, hits, doubles, triples, homeRuns, rbi, walks, strikeouts, stolenBases, caughtStealing, battingAvg, obp, slg, ops
- **`description`** / **`descriptionStatus`**: Claude-generated profile with status tracking (`pending`, `ready`, `failed`)
- **`locallyModified`**: set to `true` when a user edits a player, preventing the cron from overwriting their changes

### Folder Structure

```
src/
├── app/                     # Next.js App Router (pages + API routes)
│   ├── players/             # Player list, detail, and edit pages
│   └── api/players/         # PATCH endpoint + SSE description stream
├── components/              # React components (table, detail card, form)
├── hooks/                   # Client-side React hooks (SSE, form, pagination)
├── interactors/             # Business logic layer
├── repositories/            # Data access layer (Prisma)
├── services/                # External integrations (API, Claude, queue)
├── contracts/               # Zod validation schemas
├── workers/                 # BullMQ job processors
├── cron/                    # Scheduled sync task
├── utils/                   # Helpers (stat diff, dedup, formatting)
├── types/                   # TypeScript interfaces and enums
├── errors/                  # Custom error classes
├── lib/                     # Singleton instances (Prisma, Redis)
└── __tests__/               # Tests organized by layer
```

## Testing

Tests are split into two Jest projects to handle different module systems:

- **Backend** (Node environment, ESM) — interactors, repositories, services, API routes, workers, cron
- **Frontend** (jsdom environment, CJS) — React component tests with Testing Library

```bash
npm test              # Run all tests
npm run test:backend  # Backend only
npm run test:frontend # Frontend only
```

Backend tests run sequentially (`--runInBand`) because they share a test database. Frontend tests run in a separate process to avoid ESM/CJS module cache conflicts.

**Testing approach:**
- Integration tests hit a real test database (no Prisma mocks)
- External dependencies use dependency injection, not `jest.mock()`
- Shared test data factories in `src/__tests__/factories/player-factory.ts`
- Database is cleaned between tests via `setup-db.ts`

### Test environment

Create a `.env.test` file pointing to a separate test database:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/baseball_test
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=test
BASEBALL_API_URL=http://localhost/test
```

Create the test database and apply migrations:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/baseball_test npx prisma migrate deploy
```

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **UI**: Mantine 8 + Tailwind CSS 4
- **Database**: PostgreSQL 16 with Prisma 7
- **Queue**: BullMQ + Redis 7
- **AI**: Claude Haiku 4.5 via Anthropic SDK
- **Validation**: Zod 4
- **Testing**: Jest 30 + Testing Library
- **Language**: TypeScript 5
