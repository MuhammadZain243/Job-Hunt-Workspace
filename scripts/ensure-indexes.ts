import { connectMongoose } from "../src/lib/db/mongoose";
import { ensurePhase0Indexes } from "../src/lib/db/indexes";
import { parseServerEnv } from "../src/lib/env/server";

async function main() {
  parseServerEnv();
  await connectMongoose();
  await ensurePhase0Indexes();
  console.log("Phase 0 indexes ensured.");
  process.exit(0);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`ensure-indexes failed: ${message}`);
  process.exit(1);
});
