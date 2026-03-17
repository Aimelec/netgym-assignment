import "tsconfig-paths/register";
import cron from "node-cron";
import { syncPlayers } from "./src/cron/sync-players";

console.log("[CRON] Starting cron scheduler...");

cron.schedule("0 0 * * *", async () => {
  try {
    await syncPlayers();
  } catch (error) {
    console.error("[CRON] Sync failed:", error);
  }
});

syncPlayers().catch(console.error);
