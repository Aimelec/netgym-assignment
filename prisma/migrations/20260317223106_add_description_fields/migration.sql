-- AlterTable
ALTER TABLE "players" ADD COLUMN     "description" TEXT,
ADD COLUMN     "description_status" TEXT NOT NULL DEFAULT 'pending';
