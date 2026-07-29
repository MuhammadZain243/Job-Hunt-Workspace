import "server-only";

import { connectMongoose } from "@/lib/db/mongoose";
import { ApplicationModel } from "@/modules/applications/application.model";
import { AuditEventModel } from "@/modules/audit/audit.model";
import { CandidateProfileModel } from "@/modules/candidate-profile/candidate-profile.model";
import { CompanyModel } from "@/modules/companies/company.model";
import { ContactModel } from "@/modules/contacts/contact.model";
import { EncryptedCredentialModel } from "@/modules/credentials/credential.model";
import { ProviderConnectionModel } from "@/modules/credentials/provider-connection.model";
import { JobModel } from "@/modules/jobs/job.model";
import { ResumeModel } from "@/modules/resumes/resume.model";
import { AppSettingsModel } from "@/modules/settings/settings.model";
import { SourceDocumentModel } from "@/modules/sources/source-document.model";

/**
 * Ensures indexes for foundation, CV, and Phase 2 domain collections.
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
    CompanyModel.createIndexes(),
    ContactModel.createIndexes(),
    JobModel.createIndexes(),
    SourceDocumentModel.createIndexes(),
    ApplicationModel.createIndexes(),
  ]);
}
