import "server-only";

import { connectMongoose } from "@/lib/db/mongoose";
import { AuditEventModel } from "@/modules/audit/audit.model";
import { AppSettingsModel } from "@/modules/settings/settings.model";

/**
 * Ensures Phase 0 indexes for `audit_events` and `app_settings`.
 * Idempotent — safe to call on startup or migration scripts.
 */
export async function ensurePhase0Indexes(): Promise<void> {
  await connectMongoose();

  await Promise.all([
    AuditEventModel.createIndexes(),
    AppSettingsModel.createIndexes(),
  ]);
}
