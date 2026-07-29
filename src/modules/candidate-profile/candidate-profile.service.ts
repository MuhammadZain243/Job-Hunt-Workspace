import "server-only";

import { connectMongoose } from "@/lib/db/mongoose";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { recordAuditEvent } from "@/modules/audit/audit.service";
import { CandidateProfileModel } from "@/modules/candidate-profile/candidate-profile.model";
import type { DraftCandidateProfile } from "@/modules/candidate-profile/candidate-profile.parser";

function mapProfile(doc: {
  _id: { toString(): string };
  resumeId: string;
  headline?: string | null;
  summary?: string | null;
  contact?: {
    email?: string | null;
    phone?: string | null;
    location?: string | null;
    linkedinUrl?: string | null;
  } | null;
  skills?: unknown[];
  experience?: unknown[];
  education?: unknown[];
  projects?: unknown[];
  achievements?: unknown[];
  preferredRoles?: string[] | null;
  preferredLocations?: string[] | null;
  reviewStatus: string;
  updatedAt: Date;
}) {
  return {
    id: doc._id.toString(),
    resumeId: doc.resumeId,
    headline: doc.headline ?? "",
    summary: doc.summary ?? "",
    contact: {
      email: doc.contact?.email ?? "",
      phone: doc.contact?.phone ?? "",
      location: doc.contact?.location ?? "",
      linkedinUrl: doc.contact?.linkedinUrl ?? "",
    },
    skills: doc.skills ?? [],
    experience: doc.experience ?? [],
    education: doc.education ?? [],
    projects: doc.projects ?? [],
    achievements: doc.achievements ?? [],
    preferredRoles: doc.preferredRoles ?? [],
    preferredLocations: doc.preferredLocations ?? [],
    reviewStatus: doc.reviewStatus as "draft" | "reviewed",
    updatedAt: doc.updatedAt,
  };
}

export async function upsertCandidateProfileFromExtraction(input: {
  userId: string;
  resumeId: string;
  draft: DraftCandidateProfile;
}) {
  await connectMongoose();

  const existing = await CandidateProfileModel.findOne({
    userId: input.userId,
    resumeId: input.resumeId,
  }).lean();

  // Reviewed profiles keep owner corrections; re-extraction only refreshes CV text.
  if (existing?.reviewStatus === "reviewed") {
    return mapProfile(existing);
  }

  const profile = await CandidateProfileModel.findOneAndUpdate(
    { userId: input.userId, resumeId: input.resumeId },
    {
      $set: {
        ...input.draft,
        reviewStatus: "draft",
      },
      $setOnInsert: {
        userId: input.userId,
        resumeId: input.resumeId,
        preferredRoles: [],
        preferredLocations: [],
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();

  return mapProfile(profile);
}

export async function deleteCandidateProfileForResume(input: {
  userId: string;
  resumeId: string;
}) {
  await connectMongoose();
  await CandidateProfileModel.deleteOne({
    userId: input.userId,
    resumeId: input.resumeId,
  });
}

export async function getCandidateProfileForResume(input: {
  userId: string;
  resumeId: string;
}) {
  await connectMongoose();
  const profile = await CandidateProfileModel.findOne({
    userId: input.userId,
    resumeId: input.resumeId,
  }).lean();

  if (!profile) {
    return null;
  }

  return mapProfile(profile);
}

export async function updateCandidateProfileDraft(input: {
  userId: string;
  resumeId: string;
  headline: string;
  summary: string;
  contactEmail: string;
  contactPhone: string;
  contactLocation: string;
  contactLinkedinUrl: string;
  skillsCsv: string;
}) {
  await connectMongoose();

  const existing = await CandidateProfileModel.findOne({
    userId: input.userId,
    resumeId: input.resumeId,
  }).lean();

  if (!existing) {
    throw new NotFoundError("Candidate profile not found");
  }

  const skills = input.skillsCsv
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((name) => ({
      name,
      category: "general",
      evidence: {
        source: "user_confirmed" as const,
        excerpt: name,
      },
    }));

  const profile = await CandidateProfileModel.findOneAndUpdate(
    { userId: input.userId, resumeId: input.resumeId },
    {
      $set: {
        headline: input.headline.trim(),
        summary: input.summary.trim(),
        contact: {
          email: input.contactEmail.trim(),
          phone: input.contactPhone.trim(),
          location: input.contactLocation.trim(),
          linkedinUrl:
            input.contactLinkedinUrl.trim() ||
            existing.contact?.linkedinUrl ||
            "",
        },
        skills,
        // Keep structured sections from extraction; editable in a later pass.
        experience: existing.experience ?? [],
        education: existing.education ?? [],
        projects: existing.projects ?? [],
        achievements: existing.achievements ?? [],
        reviewStatus: "draft",
      },
    },
    { returnDocument: "after" },
  ).lean();

  if (!profile) {
    throw new NotFoundError("Candidate profile not found");
  }

  await recordAuditEvent({
    userId: input.userId,
    action: "candidate_profile.updated",
    entityType: "candidate_profile",
    entityId: profile._id.toString(),
    metadata: { resumeId: input.resumeId },
  });

  return mapProfile(profile);
}

export async function markCandidateProfileReviewed(input: {
  userId: string;
  resumeId: string;
}) {
  await connectMongoose();

  const profile = await CandidateProfileModel.findOne({
    userId: input.userId,
    resumeId: input.resumeId,
  }).lean();

  if (!profile) {
    throw new NotFoundError("Candidate profile not found");
  }

  if (!profile.headline?.trim() && !profile.summary?.trim()) {
    throw new ValidationError(
      "Add a headline or summary before marking the profile reviewed",
    );
  }

  const updated = await CandidateProfileModel.findOneAndUpdate(
    { userId: input.userId, resumeId: input.resumeId },
    { $set: { reviewStatus: "reviewed" } },
    { returnDocument: "after" },
  ).lean();

  await recordAuditEvent({
    userId: input.userId,
    action: "candidate_profile.reviewed",
    entityType: "candidate_profile",
    entityId: updated!._id.toString(),
    metadata: { resumeId: input.resumeId },
  });

  return mapProfile(updated!);
}
