-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "player_name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "games" INTEGER NOT NULL,
    "at_bat" INTEGER NOT NULL,
    "runs" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "doubles" INTEGER NOT NULL,
    "triples" INTEGER NOT NULL,
    "home_runs" INTEGER NOT NULL,
    "rbi" INTEGER NOT NULL,
    "walks" INTEGER NOT NULL,
    "strikeouts" INTEGER NOT NULL,
    "stolen_bases" INTEGER NOT NULL,
    "caught_stealing" INTEGER NOT NULL,
    "batting_avg" DOUBLE PRECISION NOT NULL,
    "obp" DOUBLE PRECISION NOT NULL,
    "slg" DOUBLE PRECISION NOT NULL,
    "ops" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_player_name_position_key" ON "players"("player_name", "position");
