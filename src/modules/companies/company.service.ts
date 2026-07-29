import "server-only";

import { connectMongoose } from "@/lib/db/mongoose";
import { ConflictError, NotFoundError } from "@/lib/errors/app-error";
import { ApplicationModel } from "@/modules/applications/application.model";
import { recordAuditEvent } from "@/modules/audit/audit.service";
import { CompanyModel } from "@/modules/companies/company.model";
import {
  createCompanySchema,
  normalizeCompanyName,
  normalizeDomain,
  updateCompanySchema,
} from "@/modules/companies/company.validation";
import { ContactModel } from "@/modules/contacts/contact.model";
import { JobModel } from "@/modules/jobs/job.model";
import type { SourceRef } from "@/modules/shared/source.types";

function mapCompany(doc: {
  _id: { toString(): string };
  name: string;
  normalizedName: string;
  domain?: string | null;
  websiteUrl?: string | null;
  linkedinUrl?: string | null;
  industry?: string | null;
  summary?: string | null;
  verificationStatus: string;
  sources?: Array<{
    sourceType: string;
    sourceUrl?: string | null;
    collectedAt: Date;
    confidence: number;
    reviewedByUser: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    normalizedName: doc.normalizedName,
    domain: doc.domain ?? "",
    websiteUrl: doc.websiteUrl ?? "",
    linkedinUrl: doc.linkedinUrl ?? "",
    industry: doc.industry ?? "",
    summary: doc.summary ?? "",
    verificationStatus: doc.verificationStatus,
    sources: (doc.sources ?? []).map((source) => ({
      sourceType: source.sourceType,
      sourceUrl: source.sourceUrl ?? undefined,
      collectedAt: source.collectedAt,
      confidence: source.confidence,
      reviewedByUser: source.reviewedByUser,
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function listCompanies(userId: string) {
  await connectMongoose();
  const docs = await CompanyModel.find({ userId }).sort({ name: 1 }).lean();
  return docs.map((doc) => mapCompany(doc));
}

export async function getCompany(userId: string, companyId: string) {
  await connectMongoose();
  const doc = await CompanyModel.findOne({ _id: companyId, userId }).lean();
  if (!doc) {
    throw new NotFoundError("Company not found");
  }
  return mapCompany(doc);
}

export async function createCompany(userId: string, input: unknown) {
  await connectMongoose();
  const parsed = createCompanySchema.parse(input);
  const normalizedName = normalizeCompanyName(parsed.name);
  const domain = normalizeDomain(parsed.domain ?? "");

  const duplicate = await CompanyModel.findOne({
    userId,
    $or: [{ normalizedName }, ...(domain ? [{ domain }] : [])],
  }).lean();

  if (duplicate) {
    throw new ConflictError(
      "A company with this name or domain already exists",
    );
  }

  const source: SourceRef = {
    sourceType: parsed.sourceType,
    sourceUrl: parsed.sourceUrl || undefined,
    collectedAt: new Date(),
    confidence: 1,
    reviewedByUser: true,
  };

  const doc = await CompanyModel.create({
    userId,
    name: parsed.name.trim(),
    normalizedName,
    domain,
    websiteUrl: parsed.websiteUrl?.trim() ?? "",
    linkedinUrl: parsed.linkedinUrl?.trim() ?? "",
    industry: parsed.industry?.trim() ?? "",
    summary: parsed.summary?.trim() ?? "",
    sources: [source],
    verificationStatus: "unverified",
  });

  await recordAuditEvent({
    userId,
    action: "company.created",
    entityType: "company",
    entityId: doc._id.toString(),
    metadata: { domain },
  });

  return mapCompany(doc.toObject());
}

export async function updateCompany(userId: string, input: unknown) {
  await connectMongoose();
  const parsed = updateCompanySchema.parse(input);
  const existing = await CompanyModel.findOne({
    _id: parsed.companyId,
    userId,
  }).lean();

  if (!existing) {
    throw new NotFoundError("Company not found");
  }

  const name = parsed.name?.trim() ?? existing.name;
  const normalizedName = normalizeCompanyName(name);
  const domain =
    parsed.domain !== undefined
      ? normalizeDomain(parsed.domain)
      : (existing.domain ?? "");

  const duplicate = await CompanyModel.findOne({
    userId,
    _id: { $ne: parsed.companyId },
    $or: [{ normalizedName }, ...(domain ? [{ domain }] : [])],
  }).lean();

  if (duplicate) {
    throw new ConflictError(
      "A company with this name or domain already exists",
    );
  }

  const doc = await CompanyModel.findOneAndUpdate(
    { _id: parsed.companyId, userId },
    {
      $set: {
        name,
        normalizedName,
        domain,
        websiteUrl: parsed.websiteUrl?.trim() ?? existing.websiteUrl,
        linkedinUrl: parsed.linkedinUrl?.trim() ?? existing.linkedinUrl,
        industry: parsed.industry?.trim() ?? existing.industry,
        summary: parsed.summary?.trim() ?? existing.summary,
      },
    },
    { returnDocument: "after" },
  ).lean();

  if (!doc) {
    throw new NotFoundError("Company not found");
  }

  await recordAuditEvent({
    userId,
    action: "company.updated",
    entityType: "company",
    entityId: parsed.companyId,
    metadata: {},
  });

  return mapCompany(doc);
}

export async function deleteCompany(userId: string, companyId: string) {
  await connectMongoose();
  const existing = await CompanyModel.findOne({
    _id: companyId,
    userId,
  }).lean();
  if (!existing) {
    throw new NotFoundError("Company not found");
  }

  const [contacts, jobs, applications] = await Promise.all([
    ContactModel.deleteMany({ userId, companyId }),
    JobModel.deleteMany({ userId, companyId }),
    ApplicationModel.deleteMany({ userId, companyId }),
  ]);

  await CompanyModel.deleteOne({ _id: companyId, userId });

  await recordAuditEvent({
    userId,
    action: "company.deleted",
    entityType: "company",
    entityId: companyId,
    metadata: {
      contactsDeleted: contacts.deletedCount ?? 0,
      jobsDeleted: jobs.deletedCount ?? 0,
      applicationsDeleted: applications.deletedCount ?? 0,
    },
  });
}

export async function listCompaniesWithStats(userId: string) {
  await connectMongoose();
  const companies = await listCompanies(userId);
  const [jobCounts, contactCounts, applicationCounts] = await Promise.all([
    JobModel.aggregate<{ _id: string; count: number }>([
      { $match: { userId } },
      { $group: { _id: "$companyId", count: { $sum: 1 } } },
    ]),
    ContactModel.aggregate<{ _id: string; count: number }>([
      { $match: { userId } },
      { $group: { _id: "$companyId", count: { $sum: 1 } } },
    ]),
    ApplicationModel.aggregate<{ _id: string; count: number }>([
      { $match: { userId } },
      { $group: { _id: "$companyId", count: { $sum: 1 } } },
    ]),
  ]);

  const jobsByCompany = new Map(jobCounts.map((row) => [row._id, row.count]));
  const contactsByCompany = new Map(
    contactCounts.map((row) => [row._id, row.count]),
  );
  const applicationsByCompany = new Map(
    applicationCounts.map((row) => [row._id, row.count]),
  );

  return companies.map((company) => ({
    ...company,
    jobCount: jobsByCompany.get(company.id) ?? 0,
    contactCount: contactsByCompany.get(company.id) ?? 0,
    applicationCount: applicationsByCompany.get(company.id) ?? 0,
  }));
}

export async function countCompanies(userId: string) {
  await connectMongoose();
  return CompanyModel.countDocuments({ userId });
}
