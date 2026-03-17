import { prisma } from "@/lib/prisma";
import { playerRepository } from "@/repositories/player-repository";

const samplePlayer = {
  playerName: "Test Player",
  position: "CF",
  games: 100,
  atBat: 400,
  runs: 60,
  hits: 120,
  doubles: 25,
  triples: 5,
  homeRuns: 15,
  rbi: 55,
  walks: 40,
  strikeouts: 80,
  stolenBases: 10,
  caughtStealing: 3,
  battingAvg: 0.3,
  obp: 0.38,
  slg: 0.5,
  ops: 0.88,
};

const anotherPlayer = {
  ...samplePlayer,
  playerName: "Another Player",
  position: "RF",
  hits: 200,
  homeRuns: 40,
};

beforeEach(async () => {
  await prisma.player.deleteMany();
});

afterAll(async () => {
  await prisma.player.deleteMany();
  await prisma.$disconnect();
});

describe("playerRepository", () => {
  describe("upsertFromApi", () => {
    it("creates a new player when it does not exist", async () => {
      const result = await playerRepository.upsertFromApi(samplePlayer);

      expect(result.id).toBeDefined();
      expect(result.playerName).toBe("Test Player");
      expect(result.position).toBe("CF");
      expect(result.hits).toBe(120);
      expect(result.homeRuns).toBe(15);
    });

    it("updates an existing player on duplicate playerName+position", async () => {
      await playerRepository.upsertFromApi(samplePlayer);
      const updated = await playerRepository.upsertFromApi({
        ...samplePlayer,
        hits: 150,
      });

      expect(updated.hits).toBe(150);

      const count = await prisma.player.count();
      expect(count).toBe(1);
    });
  });

  describe("findById", () => {
    it("returns the player when found", async () => {
      const created = await playerRepository.upsertFromApi(samplePlayer);
      const found = await playerRepository.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.playerName).toBe("Test Player");
    });

    it("returns null when not found", async () => {
      const found = await playerRepository.findById("00000000-0000-0000-0000-000000000000");
      expect(found).toBeNull();
    });
  });

  describe("findAll", () => {
    beforeEach(async () => {
      await playerRepository.upsertFromApi(samplePlayer);
      await playerRepository.upsertFromApi(anotherPlayer);
    });

    it("returns paginated results", async () => {
      const result = await playerRepository.findAll({
        page: 1,
        pageSize: 1,
        sortBy: "hits",
        sortOrder: "desc",
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(2);
      expect(result.page).toBe(1);
    });

    it("sorts by hits descending", async () => {
      const result = await playerRepository.findAll({
        page: 1,
        pageSize: 10,
        sortBy: "hits",
        sortOrder: "desc",
      });

      expect(result.data[0].playerName).toBe("Another Player");
      expect(result.data[1].playerName).toBe("Test Player");
    });

    it("sorts by homeRuns ascending", async () => {
      const result = await playerRepository.findAll({
        page: 1,
        pageSize: 10,
        sortBy: "homeRuns",
        sortOrder: "asc",
      });

      expect(result.data[0].playerName).toBe("Test Player");
      expect(result.data[1].playerName).toBe("Another Player");
    });

    it("returns correct second page", async () => {
      const result = await playerRepository.findAll({
        page: 2,
        pageSize: 1,
        sortBy: "hits",
        sortOrder: "desc",
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].playerName).toBe("Test Player");
    });
  });

  describe("update", () => {
    it("updates the specified fields", async () => {
      const created = await playerRepository.upsertFromApi(samplePlayer);
      const updated = await playerRepository.update(created.id, { hits: 999 });

      expect(updated.hits).toBe(999);
      expect(updated.playerName).toBe("Test Player");
    });
  });
});
