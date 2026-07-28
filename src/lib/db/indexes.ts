import "server-only";

import { connectMongoose } from "@/lib/db/mongoose";

/**
 * Ensures Phase 0 indexes for `audit_events` and `app_settings`.
 * Idempotent — safe to call on startup or migration scripts.
 */
export async function ensurePhase0Indexes(): Promise<void> {
  const mongoose = await connectMongoose();
  const nativeDb = mongoose.connection.db;
  if (!nativeDb) {
    throw new Error("Mongoose connection database handle is unavailable");
  }

  await nativeDb.collection("audit_events").createIndexes([
    { key: { userId: 1, createdAt: -1 }, name: "audit_events_userId_createdAt" },
    { key: { action: 1, createdAt: -1 }, name: "audit_events_action_createdAt" },
  ]);

  await nativeDb.collection("app_settings").createIndexes([
    {
      key: { userId: 1 },
      name: "app_settings_userId_unique",
      unique: true,
    },
  ]);
}
