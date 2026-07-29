import "server-only";

import { connectMongoose } from "@/lib/db/mongoose";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors/app-error";
import { recordAuditEvent } from "@/modules/audit/audit.service";
import { buildDraftCandidateProfile } from "@/modules/candidate-profile/candidate-profile.parser";
import {
  deleteCandidateProfileForResume,
  upsertCandidateProfileFromExtraction,
} from "@/modules/candidate-profile/candidate-profile.service";
import { extractTextFromCv } from "@/modules/resumes/resume.extraction";
import { ResumeModel } from "@/modules/resumes/resume.model";
import { validateCvBytes } from "@/modules/resumes/resume.validation";
import { AppSettingsModel } from "@/modules/settings/settings.model";
import {
  getActiveCvStorageProvider,
  getCvStorageProviderForName,
} from "@/providers/storage/storage-provider.factory";
import type { CvStorageProviderName } from "@/providers/storage/storage.types";

function mapResume(doc: {
  _id: { toString(): string };
  name: string;
  version: number;
  storageProvider: string;
  storageKey: string;
  storageMetadata: Record<string, unknown>;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  extractedText?: string | null;
  extractionStatus: string;
  extractionError?: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    version: doc.version,
    storageProvider: doc.storageProvider as CvStorageProviderName,
    storageKey: doc.storageKey,
    storageMetadata: doc.storageMetadata,
    originalFileName: doc.originalFileName,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    sha256: doc.sha256,
    extractionStatus: doc.extractionStatus,
    extractionError: doc.extractionError ?? null,
    hasExtractedText: Boolean(doc.extractedText?.trim()),
    isDefault: doc.isDefault,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function listResumes(userId: string) {
  await connectMongoose();
  const resumes = await ResumeModel.find({ userId })
    .sort({ isDefault: -1, updatedAt: -1 })
    .lean();
  return resumes.map(mapResume);
}

export async function getResumeForUser(userId: string, resumeId: string) {
  await connectMongoose();
  const resume = await ResumeModel.findOne({ _id: resumeId, userId }).lean();
  if (!resume) {
    throw new NotFoundError("Resume not found");
  }
  return mapResume(resume);
}

export async function uploadResume(input: {
  userId: string;
  fileName: string;
  declaredMime?: string | null;
  bytes: Uint8Array;
  name?: string;
}) {
  await connectMongoose();

  const validated = validateCvBytes({
    fileName: input.fileName,
    declaredMime: input.declaredMime,
    bytes: input.bytes,
  });

  const existing = await ResumeModel.findOne({
    userId: input.userId,
    sha256: validated.sha256,
  }).lean();

  if (existing) {
    throw new ConflictError("This CV file was already uploaded");
  }

  const provider = await getActiveCvStorageProvider(input.userId);
  const stored = await provider.uploadObject({
    userId: input.userId,
    fileName: input.fileName,
    contentType: validated.mimeType,
    bytes: input.bytes,
  });

  const count = await ResumeModel.countDocuments({ userId: input.userId });
  const isDefault = count === 0;
  const displayName =
    input.name?.trim() ||
    input.fileName.replace(/\.(pdf|docx)$/i, "") ||
    "CV";

  try {
    const resume = await ResumeModel.create({
      userId: input.userId,
      name: displayName,
      version: count + 1,
      storageProvider: stored.storageProvider,
      storageKey: stored.storageKey,
      storageMetadata: stored.storageMetadata,
      originalFileName: input.fileName,
      mimeType: validated.mimeType,
      sizeBytes: validated.sizeBytes,
      sha256: validated.sha256,
      extractionStatus: "pending",
      isDefault,
    });

    if (isDefault) {
      await AppSettingsModel.findOneAndUpdate(
        { userId: input.userId },
        { defaultCvId: resume._id.toString() },
        { upsert: true },
      );
    }

    await recordAuditEvent({
      userId: input.userId,
      action: "resume.uploaded",
      entityType: "resume",
      entityId: resume._id.toString(),
      metadata: {
        provider: stored.storageProvider,
        mimeType: validated.mimeType,
        sizeBytes: validated.sizeBytes,
      },
    });

    return mapResume(resume.toObject());
  } catch (error) {
    await provider.deleteFile({
      userId: input.userId,
      storageKey: stored.storageKey,
      storageProvider: stored.storageProvider,
      storageMetadata: stored.storageMetadata,
    });
    throw error;
  }
}

export async function renameResume(input: {
  userId: string;
  resumeId: string;
  name: string;
}) {
  await connectMongoose();
  const name = input.name.trim();
  if (!name) {
    throw new ValidationError("Name is required");
  }

  const resume = await ResumeModel.findOneAndUpdate(
    { _id: input.resumeId, userId: input.userId },
    { name },
    { returnDocument: "after" },
  ).lean();

  if (!resume) {
    throw new NotFoundError("Resume not found");
  }

  await recordAuditEvent({
    userId: input.userId,
    action: "resume.renamed",
    entityType: "resume",
    entityId: input.resumeId,
    metadata: { name },
  });

  return mapResume(resume);
}

export async function setDefaultResume(input: {
  userId: string;
  resumeId: string;
}) {
  await connectMongoose();
  const resume = await ResumeModel.findOne({
    _id: input.resumeId,
    userId: input.userId,
  }).lean();

  if (!resume) {
    throw new NotFoundError("Resume not found");
  }

  await ResumeModel.updateMany(
    { userId: input.userId, isDefault: true },
    { $set: { isDefault: false } },
  );
  await ResumeModel.updateOne(
    { _id: input.resumeId, userId: input.userId },
    { $set: { isDefault: true } },
  );
  await AppSettingsModel.findOneAndUpdate(
    { userId: input.userId },
    { defaultCvId: input.resumeId },
    { upsert: true },
  );

  await recordAuditEvent({
    userId: input.userId,
    action: "resume.default_set",
    entityType: "resume",
    entityId: input.resumeId,
    metadata: {},
  });

  return getResumeForUser(input.userId, input.resumeId);
}

export async function deleteResume(input: {
  userId: string;
  resumeId: string;
}) {
  await connectMongoose();
  const resume = await ResumeModel.findOne({
    _id: input.resumeId,
    userId: input.userId,
  }).lean();

  if (!resume) {
    throw new NotFoundError("Resume not found");
  }

  const provider = await getCvStorageProviderForName(
    input.userId,
    resume.storageProvider as CvStorageProviderName,
  );

  try {
    await provider.deleteFile({
      userId: input.userId,
      storageKey: resume.storageKey,
      storageProvider: resume.storageProvider as CvStorageProviderName,
      storageMetadata: resume.storageMetadata as Record<
        string,
        string | number | boolean | null | undefined
      >,
    });
  } catch {
    // Idempotent delete: continue removing the DB record even if provider asset is gone.
  }

  await ResumeModel.deleteOne({ _id: input.resumeId, userId: input.userId });
  await deleteCandidateProfileForResume({
    userId: input.userId,
    resumeId: input.resumeId,
  });

  if (resume.isDefault) {
    const next = await ResumeModel.findOne({ userId: input.userId })
      .sort({ updatedAt: -1 })
      .lean();
    if (next) {
      await ResumeModel.updateOne(
        { _id: next._id },
        { $set: { isDefault: true } },
      );
      await AppSettingsModel.findOneAndUpdate(
        { userId: input.userId },
        { defaultCvId: next._id.toString() },
      );
    } else {
      await AppSettingsModel.findOneAndUpdate(
        { userId: input.userId },
        { defaultCvId: null },
      );
    }
  }

  await recordAuditEvent({
    userId: input.userId,
    action: "resume.deleted",
    entityType: "resume",
    entityId: input.resumeId,
    metadata: { provider: resume.storageProvider },
  });
}

export async function createResumeDownloadUrl(input: {
  userId: string;
  resumeId: string;
}) {
  await connectMongoose();
  const resume = await ResumeModel.findOne({
    _id: input.resumeId,
    userId: input.userId,
  }).lean();

  if (!resume) {
    throw new NotFoundError("Resume not found");
  }

  const url = `/api/resumes/download?resumeId=${encodeURIComponent(resume._id.toString())}`;

  await recordAuditEvent({
    userId: input.userId,
    action: "resume.download_url_created",
    entityType: "resume",
    entityId: input.resumeId,
    metadata: { provider: resume.storageProvider },
  });

  return { url, fileName: resume.originalFileName };
}

export async function processResumeExtraction(input: {
  userId: string;
  resumeId: string;
}) {
  await connectMongoose();
  const resume = await ResumeModel.findOne({
    _id: input.resumeId,
    userId: input.userId,
  }).lean();

  if (!resume) {
    throw new NotFoundError("Resume not found");
  }

  await ResumeModel.updateOne(
    { _id: input.resumeId, userId: input.userId },
    {
      $set: {
        extractionStatus: "processing",
        extractionError: null,
      },
    },
  );

  try {
    const provider = await getCvStorageProviderForName(
      input.userId,
      resume.storageProvider as CvStorageProviderName,
    );
    const bytes = await provider.getFile({
      userId: input.userId,
      storageKey: resume.storageKey,
      storageProvider: resume.storageProvider as CvStorageProviderName,
      storageMetadata: resume.storageMetadata as Record<
        string,
        string | number | boolean | null | undefined
      >,
    });

    const text = await extractTextFromCv({
      mimeType: resume.mimeType,
      bytes,
    });

    await ResumeModel.updateOne(
      { _id: input.resumeId, userId: input.userId },
      {
        $set: {
          extractedText: text,
          extractionStatus: "succeeded",
          extractionError: null,
        },
      },
    );

    const draft = buildDraftCandidateProfile(text);
    await upsertCandidateProfileFromExtraction({
      userId: input.userId,
      resumeId: input.resumeId,
      draft,
    });

    await recordAuditEvent({
      userId: input.userId,
      action: "resume.extraction_succeeded",
      entityType: "resume",
      entityId: input.resumeId,
      metadata: { characters: text.length },
    });

    return { ok: true as const };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Extraction failed";

    await ResumeModel.updateOne(
      { _id: input.resumeId, userId: input.userId },
      {
        $set: {
          extractionStatus: "failed",
          extractionError: message,
        },
      },
    );

    await recordAuditEvent({
      userId: input.userId,
      action: "resume.extraction_failed",
      entityType: "resume",
      entityId: input.resumeId,
      metadata: { reason: "extraction_error" },
    });

    throw error;
  }
}
