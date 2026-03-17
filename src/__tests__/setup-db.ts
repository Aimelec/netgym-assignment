import { prisma } from "@/lib/prisma";

beforeEach(async () => {
  await prisma.player.deleteMany();
});

afterAll(async () => {
  await prisma.player.deleteMany();
  await prisma.$disconnect();
});
