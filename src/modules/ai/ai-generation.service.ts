import "server-only";

import {
  buildJobMatchPrompt,
  buildLinkedInDraftPrompt,
  buildOutreachEmailPrompt,
} from "@/prompts/outreach";
import { connectMongoose } from "@/lib/db/mongoose";
import {
  NotFoundError,
  ProviderAuthError,
  ValidationError,
} from "@/lib/errors/app-error";
import {
  buildGroundingPacket,
  validateGenerationAgainstPacket,
} from "@/modules/ai/ai.grounding";
import { AiGenerationModel } from "@/modules/ai/ai-generation.model";
import {
  jobMatchJsonSchema,
  jobMatchOutputSchema,
  linkedInDraftJsonSchema,
  linkedInDraftOutputSchema,
  outreachEmailJsonSchema,
  outreachEmailOutputSchema,
} from "@/modules/ai/ai.schemas";
import { getApplication } from "@/modules/applications/application.service";
import { recordAuditEvent } from "@/modules/audit/audit.service";
import { getCandidateProfileForResume } from "@/modules/candidate-profile/candidate-profile.service";
import { getCompany } from "@/modules/companies/company.service";
import { listContacts } from "@/modules/contacts/contact.service";
import {
  disconnectProviderConfiguration,
  getProviderSecret,
  listProviderConnections,
  saveProviderSecret,
} from "@/modules/credentials/credential.service";
import { getJob } from "@/modules/jobs/job.service";
import {
  createStructuredResponse,
  testOpenAiConnection,
} from "@/providers/ai/openai/openai.client";
import {
  maskOpenAiKey,
  openaiCredentialsSchema,
} from "@/providers/ai/openai/openai.validation";

async function requireOpenAiCredentials(userId: string) {
  const secret = await getProviderSecret({ userId, provider: "openai" });
  if (!secret) {
    throw new ProviderAuthError(
      "Connect an OpenAI API key in Settings before generating drafts.",
    );
  }
  return openaiCredentialsSchema.parse(JSON.parse(secret));
}

async function loadGenerationContext(userId: string, applicationId: string) {
  const application = await getApplication(userId, applicationId);
  const [job, company] = await Promise.all([
    getJob(userId, application.jobId),
    getCompany(userId, application.companyId),
  ]);

  if (!job.selectedRoleId || !job.selectedRoleTitle) {
    throw new ValidationError(
      "Select a target role on the job before generating drafts.",
    );
  }

  if (!application.resumeId) {
    throw new ValidationError(
      "Link a CV on the application before generating drafts.",
    );
  }

  const profile = await getCandidateProfileForResume({
    userId,
    resumeId: application.resumeId,
  });

  if (!profile) {
    throw new NotFoundError("Candidate profile not found for the linked CV");
  }

  if (profile.reviewStatus !== "reviewed") {
    throw new ValidationError(
      "Mark the candidate profile as reviewed before generating outreach.",
    );
  }

  const contacts = await listContacts(userId, {
    companyId: application.companyId,
  });
  const contact =
    contacts.find((item) => item.id === application.primaryContactId) ??
    contacts[0] ??
    null;

  const packet = buildGroundingPacket({
    profile: {
      reviewStatus: profile.reviewStatus,
      headline: profile.headline,
      summary: profile.summary,
      preferredRoles: profile.preferredRoles,
      skills: profile.skills as Array<{
        name: string;
        evidence?: { excerpt?: string };
      }>,
      experience: profile.experience as Array<{
        title: string;
        company: string;
        bullets?: string[];
        evidence?: { excerpt?: string };
      }>,
      achievements: profile.achievements as Array<{
        text: string;
        evidence?: { excerpt?: string };
      }>,
    },
    job,
    company,
    contact,
  });

  return { application, job, company, profile, contact, packet };
}

function mapGeneration(doc: {
  _id: { toString(): string };
  applicationId: string;
  purpose: string;
  provider: string;
  model: string;
  promptVersion: string;
  inputSourceRefs?: string[];
  output: unknown;
  warnings?: string[];
  tokenUsage?: {
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
  } | null;
  reviewedAt?: Date | null;
  acceptedAt?: Date | null;
  createdAt: Date;
}) {
  return {
    id: doc._id.toString(),
    applicationId: doc.applicationId,
    purpose: doc.purpose,
    provider: doc.provider,
    model: doc.model,
    promptVersion: doc.promptVersion,
    inputSourceRefs: doc.inputSourceRefs ?? [],
    output: doc.output,
    warnings: doc.warnings ?? [],
    tokenUsage: {
      inputTokens: doc.tokenUsage?.inputTokens ?? null,
      outputTokens: doc.tokenUsage?.outputTokens ?? null,
      totalTokens: doc.tokenUsage?.totalTokens ?? null,
    },
    reviewedAt: doc.reviewedAt ?? null,
    acceptedAt: doc.acceptedAt ?? null,
    createdAt: doc.createdAt,
  };
}

async function persistGeneration(input: {
  userId: string;
  applicationId: string;
  purpose: "job_match" | "outreach_email" | "linkedin_draft";
  model: string;
  promptVersion: string;
  inputSourceRefs: string[];
  output: unknown;
  warnings: string[];
  tokenUsage: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
  };
}) {
  await connectMongoose();
  const doc = await AiGenerationModel.create({
    userId: input.userId,
    applicationId: input.applicationId,
    purpose: input.purpose,
    provider: "openai",
    model: input.model,
    promptVersion: input.promptVersion,
    inputSourceRefs: input.inputSourceRefs,
    output: input.output,
    warnings: input.warnings,
    tokenUsage: input.tokenUsage,
  });

  await recordAuditEvent({
    userId: input.userId,
    action: `ai.${input.purpose}.generated`,
    entityType: "ai_generation",
    entityId: doc._id.toString(),
    metadata: {
      applicationId: input.applicationId,
      model: input.model,
      promptVersion: input.promptVersion,
    },
  });

  return mapGeneration(doc.toObject());
}

export async function getOpenAiConnectionView(userId: string) {
  const connections = await listProviderConnections(userId);
  const openai = connections.find((item) => item.provider === "openai");
  return openai
    ? {
        status: openai.status,
        accountLabel: openai.maskedLabel,
        lastCheckedAt: openai.lastCheckedAt,
      }
    : null;
}

export async function saveAndTestOpenAiConnection(
  userId: string,
  apiKey: string,
) {
  const parsed = openaiCredentialsSchema.parse({ apiKey });
  await testOpenAiConnection(parsed);

  await saveProviderSecret({
    userId,
    provider: "openai",
    accountLabel: maskOpenAiKey(parsed.apiKey),
    secret: JSON.stringify(parsed),
    externalAccountId: maskOpenAiKey(parsed.apiKey),
  });

  await recordAuditEvent({
    userId,
    action: "ai.openai.connected",
    entityType: "provider_connection",
    metadata: { provider: "openai" },
  });
}

export async function disconnectOpenAiConnection(userId: string) {
  await disconnectProviderConfiguration({ userId, provider: "openai" });
  await recordAuditEvent({
    userId,
    action: "ai.openai.disconnected",
    entityType: "provider_connection",
    metadata: { provider: "openai" },
  });
}

export async function generateJobMatch(userId: string, applicationId: string) {
  const credentials = await requireOpenAiCredentials(userId);
  const context = await loadGenerationContext(userId, applicationId);
  const prompt = buildJobMatchPrompt(JSON.stringify(context.packet));

  const response = await createStructuredResponse<unknown>({
    credentials,
    system: prompt.system,
    user: prompt.user,
    schemaName: "job_match_output",
    schema: jobMatchJsonSchema as unknown as Record<string, unknown>,
  });

  const output = jobMatchOutputSchema.parse(response.parsed);
  return persistGeneration({
    userId,
    applicationId,
    purpose: "job_match",
    model: response.model,
    promptVersion: prompt.version,
    inputSourceRefs: [
      context.job.id,
      context.company.id,
      context.application.resumeId!,
    ],
    output,
    warnings: output.warnings,
    tokenUsage: response.tokenUsage,
  });
}

export async function generateOutreachEmail(
  userId: string,
  applicationId: string,
) {
  const credentials = await requireOpenAiCredentials(userId);
  const context = await loadGenerationContext(userId, applicationId);
  const prompt = buildOutreachEmailPrompt(JSON.stringify(context.packet));

  const response = await createStructuredResponse<unknown>({
    credentials,
    system: prompt.system,
    user: prompt.user,
    schemaName: "outreach_email_output",
    schema: outreachEmailJsonSchema as unknown as Record<string, unknown>,
  });

  const output = outreachEmailOutputSchema.parse(response.parsed);
  const extraWarnings = validateGenerationAgainstPacket({
    packet: context.packet,
    factsUsed: output.factsUsed,
    firstPersonText: `${output.plainText}\n${output.coverLetterPlainText}`,
  });

  return persistGeneration({
    userId,
    applicationId,
    purpose: "outreach_email",
    model: response.model,
    promptVersion: prompt.version,
    inputSourceRefs: [
      context.job.id,
      context.company.id,
      context.application.resumeId!,
    ],
    output,
    warnings: [...output.warnings, ...extraWarnings],
    tokenUsage: response.tokenUsage,
  });
}

export async function generateLinkedInDraft(
  userId: string,
  applicationId: string,
) {
  const credentials = await requireOpenAiCredentials(userId);
  const context = await loadGenerationContext(userId, applicationId);
  const prompt = buildLinkedInDraftPrompt(JSON.stringify(context.packet));

  const response = await createStructuredResponse<unknown>({
    credentials,
    system: prompt.system,
    user: prompt.user,
    schemaName: "linkedin_draft_output",
    schema: linkedInDraftJsonSchema as unknown as Record<string, unknown>,
  });

  const output = linkedInDraftOutputSchema.parse(response.parsed);
  const extraWarnings = validateGenerationAgainstPacket({
    packet: context.packet,
    factsUsed: output.factsUsed,
    firstPersonText: `${output.connectionNote}\n${output.message}`,
  });

  return persistGeneration({
    userId,
    applicationId,
    purpose: "linkedin_draft",
    model: response.model,
    promptVersion: prompt.version,
    inputSourceRefs: [
      context.job.id,
      context.company.id,
      context.application.resumeId!,
    ],
    output,
    warnings: [...output.warnings, ...extraWarnings],
    tokenUsage: response.tokenUsage,
  });
}

export async function listGenerationsForApplication(
  userId: string,
  applicationId: string,
) {
  await connectMongoose();
  const docs = await AiGenerationModel.find({ userId, applicationId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  return docs.map(mapGeneration);
}

export async function acceptGeneration(input: {
  userId: string;
  generationId: string;
  editedOutput?: unknown;
}) {
  await connectMongoose();
  const doc = await AiGenerationModel.findOneAndUpdate(
    { _id: input.generationId, userId: input.userId },
    {
      $set: {
        ...(input.editedOutput ? { output: input.editedOutput } : {}),
        acceptedAt: new Date(),
        reviewedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  ).lean();

  if (!doc) {
    throw new NotFoundError("Generation not found");
  }

  await recordAuditEvent({
    userId: input.userId,
    action: "ai.generation.accepted",
    entityType: "ai_generation",
    entityId: input.generationId,
    metadata: { purpose: doc.purpose },
  });

  return mapGeneration(doc);
}
