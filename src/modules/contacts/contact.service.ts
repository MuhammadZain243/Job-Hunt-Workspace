import "server-only";

import { connectMongoose } from "@/lib/db/mongoose";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { recordAuditEvent } from "@/modules/audit/audit.service";
import { getCompany } from "@/modules/companies/company.service";
import { ContactModel } from "@/modules/contacts/contact.model";
import type { SourceRef } from "@/modules/shared/source.types";
import { createContactSchema } from "@/modules/contacts/contact.validation";

function mapContact(doc: {
  _id: { toString(): string };
  companyId: string;
  fullName: string;
  title?: string | null;
  department?: string | null;
  email?: string | null;
  emailStatus: string;
  linkedinUrl?: string | null;
  source: {
    sourceType: string;
    sourceUrl?: string | null;
    collectedAt: Date;
    confidence: number;
    reviewedByUser: boolean;
  };
  confidence: number;
  reviewedAt?: Date | null;
  suppressedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: doc._id.toString(),
    companyId: doc.companyId,
    fullName: doc.fullName,
    title: doc.title ?? "",
    department: doc.department ?? "",
    email: doc.email ?? "",
    emailStatus: doc.emailStatus,
    linkedinUrl: doc.linkedinUrl ?? "",
    source: {
      sourceType: doc.source.sourceType,
      sourceUrl: doc.source.sourceUrl ?? undefined,
      collectedAt: doc.source.collectedAt,
      confidence: doc.source.confidence,
      reviewedByUser: doc.source.reviewedByUser,
    },
    confidence: doc.confidence,
    reviewedAt: doc.reviewedAt ?? null,
    suppressedAt: doc.suppressedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function listContacts(
  userId: string,
  filters?: { companyId?: string },
) {
  await connectMongoose();
  const query: Record<string, string> = { userId };
  if (filters?.companyId) {
    query.companyId = filters.companyId;
  }
  const docs = await ContactModel.find(query).sort({ fullName: 1 }).lean();
  return docs.map(mapContact);
}

export async function createContact(userId: string, input: unknown) {
  await connectMongoose();
  const parsed = createContactSchema.parse(input);
  await getCompany(userId, parsed.companyId);

  if (!parsed.email && !parsed.linkedinUrl) {
    throw new ValidationError(
      "Provide an email or LinkedIn URL for the contact",
    );
  }

  const source: SourceRef = {
    sourceType: parsed.sourceType,
    sourceUrl: parsed.sourceUrl || undefined,
    collectedAt: new Date(),
    confidence: parsed.confidence,
    reviewedByUser: true,
  };

  const doc = await ContactModel.create({
    userId,
    companyId: parsed.companyId,
    fullName: parsed.fullName.trim(),
    title: parsed.title?.trim() ?? "",
    department: parsed.department?.trim() ?? "",
    email: parsed.email?.trim().toLowerCase() ?? "",
    emailStatus: parsed.emailStatus,
    linkedinUrl: parsed.linkedinUrl?.trim() ?? "",
    source,
    confidence: parsed.confidence,
    reviewedAt: new Date(),
  });

  await recordAuditEvent({
    userId,
    action: "contact.created",
    entityType: "contact",
    entityId: doc._id.toString(),
    metadata: { companyId: parsed.companyId },
  });

  return mapContact(doc.toObject());
}

export async function suppressContact(userId: string, contactId: string) {
  await connectMongoose();
  const doc = await ContactModel.findOneAndUpdate(
    { _id: contactId, userId },
    { $set: { suppressedAt: new Date() } },
    { returnDocument: "after" },
  ).lean();

  if (!doc) {
    throw new NotFoundError("Contact not found");
  }

  await recordAuditEvent({
    userId,
    action: "contact.suppressed",
    entityType: "contact",
    entityId: contactId,
    metadata: {},
  });

  return mapContact(doc);
}

export async function deleteContact(userId: string, contactId: string) {
  await connectMongoose();
  const result = await ContactModel.deleteOne({ _id: contactId, userId });
  if (result.deletedCount === 0) {
    throw new NotFoundError("Contact not found");
  }

  await recordAuditEvent({
    userId,
    action: "contact.deleted",
    entityType: "contact",
    entityId: contactId,
    metadata: {},
  });
}

export async function countContacts(userId: string) {
  await connectMongoose();
  return ContactModel.countDocuments({ userId });
}
