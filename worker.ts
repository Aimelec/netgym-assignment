import "tsconfig-paths/register";
import { startDescriptionWorker } from "./src/workers/description-worker";

console.log("[Worker] Starting description worker...");
startDescriptionWorker();
