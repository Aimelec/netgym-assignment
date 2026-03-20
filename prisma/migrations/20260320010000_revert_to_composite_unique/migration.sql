-- DropIndex
DROP INDEX IF EXISTS "players_player_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "players_player_name_position_key" ON "players"("player_name", "position");
