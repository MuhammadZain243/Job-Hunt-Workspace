import "server-only";

import { connectMongoose } from "@/lib/db/mongoose";
import { AuditEventModel } from "@/modules/audit/audit.model";
import { CandidateProfileModel } from "@/modules/candidate-profile/candidate-profile.model";
import { EncryptedCredentialModel } from "@/modules/credentials/credential.model";
import { ProviderConnectionModel } from "@/modules/credentials/provider-connection.model";
import { ResumeModel } from "@/modules/resumes/resume.model";
import { AppSettingsModel } from "@/modules/settings/settings.model";

/**
 * Ensures indexes for foundation and CV domain collections.
 * Idempotent — safe to call on startup or migration scripts.
 */
export async function ensurePhase0Indexes(): Promise<void> {
  await connectMongoose();

  await Promise.all([
    AuditEventModel.createIndexes(),
    AppSettingsModel.createIndexes(),
    EncryptedCredentialModel.createIndexes(),
    ProviderConnectionModel.createIndexes(),
    ResumeModel.createIndexes(),
    CandidateProfileModel.createIndexes(),
  ]);
}
