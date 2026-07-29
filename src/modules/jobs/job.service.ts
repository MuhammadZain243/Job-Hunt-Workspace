import "server-only";

import { connectMongoose } from "@/lib/db/mongoose";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { recordAuditEvent } from "@/modules/audit/audit.service";
import { getCompany } from "@/modules/companies/company.service";
import { extractJobDraftFromText } from "@/modules/jobs/job.extraction";
import { JobModel } from "@/modules/jobs/job.model";
import {
  csvFromTextarea,
  importJobSchema,
  linesFromTextarea,
  selectJobRoleSchema,
  updateJobReviewSchema,
} from "@/modules/jobs/job.validation";
import { ApplicationModel } from "@/modules/applications/application.model";
import { createManualSourceDocument } from "@/modules/sources/source-document.service";

function mapJob(doc: {
  _id: { toString(): string };
  companyId: string;
  sourceId: string;
  sourceUrl?: string | null;
  title: string;
  roleOptions?: Array<{ id: string; title: string; selected: boolean }>;
  selectedRoleId?: string | null;
  description?: string | null;
  requirements?: string[];
  responsibilities?: string[];
  skills?: string[];
  location?: string | null;
  workplaceType?: string | null;
  employmentType?: string | null;
  applicationUrl?: string | null;
  contactIds?: string[];
  status: string;
  extractionWarnings?: string[];
  createdAt: Date;
  updatedAt: Date;
}) {
  const roleOptions = doc.roleOptions ?? [];
  const selectedRole =
    roleOptions.find((role) => role.id === doc.selectedRoleId) ??
    roleOptions.find((role) => role.selected) ??
    null;

  return {
    id: doc._id.toString(),
    companyId: doc.companyId,
    sourceId: doc.sourceId,
    sourceUrl: doc.sourceUrl ?? "",
    title: doc.title,
    roleOptions,
    selectedRoleId: doc.selectedRoleId ?? null,
    selectedRoleTitle: selectedRole?.title ?? null,
    description: doc.description ?? "",
    requirements: doc.requirements ?? [],
    responsibilities: doc.responsibilities ?? [],
    skills: doc.skills ?? [],
    location: doc.location ?? "",
    workplaceType: doc.workplaceType ?? "",
    employmentType: doc.employmentType ?? "",
    applicationUrl: doc.applicationUrl ?? "",
    contactIds: doc.contactIds ?? [],
    status: doc.status,
    extractionWarnings: doc.extractionWarnings ?? [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function listJobs(
  userId: string,
  filters?: { companyId?: string },
) {
  await connectMongoose();
  const query: Record<string, string> = { userId };
  if (filters?.companyId) {
    query.companyId = filters.companyId;
  }
  const docs = await JobModel.find(query).sort({ updatedAt: -1 }).lean();
  return docs.map(mapJob);
}

export async function getJob(userId: string, jobId: string) {
  await connectMongoose();
  const doc = await JobModel.findOne({ _id: jobId, userId }).lean();
  if (!doc) {
    throw new NotFoundError("Job not found");
  }
  return mapJob(doc);
}

export async function importManualJob(userId: string, input: unknown) {
  await connectMongoose();
  const parsed = importJobSchema.parse(input);
  await getCompany(userId, parsed.companyId);

  const draft = extractJobDraftFromText(parsed.pastedText);
  const source = await createManualSourceDocument({
    userId,
    url: parsed.sourceUrl,
    title: draft.title,
    content: draft.description,
  });

  const selectedRoleId =
    draft.roleOptions.length === 1 ? draft.roleOptions[0]!.id : null;

  const doc = await JobModel.create({
    userId,
    companyId: parsed.companyId,
    sourceId: source.id,
    sourceUrl: parsed.sourceUrl?.trim() ?? "",
    title: draft.title,
    roleOptions: draft.roleOptions.map((role) => ({
      ...role,
      selected: role.id === selectedRoleId,
    })),
    selectedRoleId,
    description: draft.description,
    requirements: draft.requirements,
    responsibilities: draft.responsibilities,
    skills: draft.skills,
    location: draft.location,
    workplaceType: draft.workplaceType,
    employmentType: draft.employmentType,
    applicationUrl:
      parsed.applicationUrl?.trim() ?? parsed.sourceUrl?.trim() ?? "",
    status: "active",
    facts: [
      {
        field: "title",
        value: draft.title,
        sourceType: source.type,
        sourceUrl: parsed.sourceUrl || undefined,
        confidence: 0.7,
        reviewedByUser: false,
      },
    ],
    extractionWarnings: draft.warnings,
  });

  await recordAuditEvent({
    userId,
    action: "job.imported",
    entityType: "job",
    entityId: doc._id.toString(),
    metadata: {
      companyId: parsed.companyId,
      roleCount: draft.roleOptions.length,
    },
  });

  return mapJob(doc.toObject());
}

export async function selectJobRole(userId: string, input: unknown) {
  await connectMongoose();
  const parsed = selectJobRoleSchema.parse(input);
  const job = await JobModel.findOne({ _id: parsed.jobId, userId }).lean();
  if (!job) {
    throw new NotFoundError("Job not found");
  }

  const role = (job.roleOptions ?? []).find(
    (item) => item.id === parsed.roleId,
  );
  if (!role) {
    throw new ValidationError("Selected role was not found on this job");
  }

  const roleOptions = (job.roleOptions ?? []).map((item) => ({
    ...item,
    selected: item.id === parsed.roleId,
  }));

  const doc = await JobModel.findOneAndUpdate(
    { _id: parsed.jobId, userId },
    {
      $set: {
        selectedRoleId: parsed.roleId,
        roleOptions,
        title: role.title,
      },
    },
    { returnDocument: "after" },
  ).lean();

  await recordAuditEvent({
    userId,
    action: "job.role_selected",
    entityType: "job",
    entityId: parsed.jobId,
    metadata: { roleId: parsed.roleId },
  });

  return mapJob(doc!);
}

export async function updateJobReview(userId: string, input: unknown) {
  await connectMongoose();
  const parsed = updateJobReviewSchema.parse(input);

  const doc = await JobModel.findOneAndUpdate(
    { _id: parsed.jobId, userId },
    {
      $set: {
        title: parsed.title.trim(),
        location: parsed.location?.trim() ?? "",
        workplaceType: parsed.workplaceType?.trim() ?? "",
        employmentType: parsed.employmentType?.trim() ?? "",
        applicationUrl: parsed.applicationUrl?.trim() ?? "",
        requirements: linesFromTextarea(parsed.requirementsText),
        responsibilities: linesFromTextarea(parsed.responsibilitiesText),
        skills: csvFromTextarea(parsed.skillsText),
      },
    },
    { returnDocument: "after" },
  ).lean();

  if (!doc) {
    throw new NotFoundError("Job not found");
  }

  await recordAuditEvent({
    userId,
    action: "job.reviewed",
    entityType: "job",
    entityId: parsed.jobId,
    metadata: {},
  });

  return mapJob(doc);
}

export async function requireSelectedTargetRole(
  userId: string,
  jobId: string,
): Promise<string> {
  const job = await getJob(userId, jobId);
  if (!job.selectedRoleId || !job.selectedRoleTitle) {
    throw new ValidationError(
      "Select a target role on the job before creating an application",
    );
  }
  return job.selectedRoleTitle;
}

export async function deleteJob(userId: string, jobId: string) {
  await connectMongoose();
  const job = await JobModel.findOne({ _id: jobId, userId }).lean();
  if (!job) {
    throw new NotFoundError("Job not found");
  }

  const applications = await ApplicationModel.deleteMany({ userId, jobId });
  await JobModel.deleteOne({ _id: jobId, userId });

  await recordAuditEvent({
    userId,
    action: "job.deleted",
    entityType: "job",
    entityId: jobId,
    metadata: {
      applicationsDeleted: applications.deletedCount ?? 0,
    },
  });
}

export async function countJobs(userId: string) {
  await connectMongoose();
  return JobModel.countDocuments({ userId });
}
