"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { requireSession } from "@/lib/auth/session";
import { isAppError } from "@/lib/errors/app-error";
import {
  getCandidateProfileForResume,
  markCandidateProfileReviewed,
  updateCandidateProfileDraft,
} from "@/modules/candidate-profile/candidate-profile.service";
import { enqueueResumeExtraction } from "@/modules/resumes/resume.jobs";
import {
  createResumeDownloadUrl,
  deleteResume,
  renameResume,
  setDefaultResume,
  uploadResume,
} from "@/modules/resumes/resume.service";

function feedbackRedirect(params: string): never {
  redirect(`/cv-library?${params}`);
}

export async function uploadResumeAction(formData: FormData): Promise<void> {
  const { user } = await requireSession();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    feedbackRedirect("error=missing-file");
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const resume = await uploadResume({
      userId: user.id,
      fileName: file.name,
      declaredMime: file.type,
      bytes,
      name: String(formData.get("name") ?? ""),
    });

    await enqueueResumeExtraction({
      userId: user.id,
      resumeId: resume.id,
    });

    revalidatePath("/cv-library");
    feedbackRedirect(`success=uploaded&resumeId=${resume.id}`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    if (isAppError(error)) {
      feedbackRedirect(`error=${encodeURIComponent(error.code.toLowerCase())}`);
    }
    feedbackRedirect("error=upload-failed");
  }
}

export async function renameResumeAction(formData: FormData): Promise<void> {
  const { user } = await requireSession();
  const resumeId = String(formData.get("resumeId") ?? "");
  const name = String(formData.get("name") ?? "");

  try {
    await renameResume({ userId: user.id, resumeId, name });
    revalidatePath("/cv-library");
    feedbackRedirect("success=renamed");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    feedbackRedirect("error=rename-failed");
  }
}

export async function setDefaultResumeAction(formData: FormData): Promise<void> {
  const { user } = await requireSession();
  const resumeId = String(formData.get("resumeId") ?? "");

  try {
    await setDefaultResume({ userId: user.id, resumeId });
    revalidatePath("/cv-library");
    feedbackRedirect("success=default-set");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    feedbackRedirect("error=default-failed");
  }
}

export async function deleteResumeAction(formData: FormData): Promise<void> {
  const { user } = await requireSession();
  const resumeId = String(formData.get("resumeId") ?? "");

  try {
    await deleteResume({ userId: user.id, resumeId });
    revalidatePath("/cv-library");
    feedbackRedirect("success=deleted");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    feedbackRedirect("error=delete-failed");
  }
}

export async function downloadResumeAction(formData: FormData): Promise<void> {
  const { user } = await requireSession();
  const resumeId = String(formData.get("resumeId") ?? "");

  try {
    const { url } = await createResumeDownloadUrl({
      userId: user.id,
      resumeId,
    });
    redirect(url);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    feedbackRedirect("error=download-failed");
  }
}

export async function reprocessResumeAction(formData: FormData): Promise<void> {
  const { user } = await requireSession();
  const resumeId = String(formData.get("resumeId") ?? "");

  try {
    await enqueueResumeExtraction({ userId: user.id, resumeId });
    revalidatePath("/cv-library");
    feedbackRedirect(`success=processing&resumeId=${resumeId}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    feedbackRedirect("error=process-failed");
  }
}

export async function saveCandidateProfileAction(
  formData: FormData,
): Promise<void> {
  const { user } = await requireSession();
  const resumeId = String(formData.get("resumeId") ?? "");

  try {
    await updateCandidateProfileDraft({
      userId: user.id,
      resumeId,
      headline: String(formData.get("headline") ?? ""),
      summary: String(formData.get("summary") ?? ""),
      contactEmail: String(formData.get("contactEmail") ?? ""),
      contactPhone: String(formData.get("contactPhone") ?? ""),
      contactLocation: String(formData.get("contactLocation") ?? ""),
      skillsCsv: String(formData.get("skillsCsv") ?? ""),
    });
    revalidatePath("/cv-library");
    feedbackRedirect(`success=profile-saved&resumeId=${resumeId}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    feedbackRedirect("error=profile-save-failed");
  }
}

export async function markProfileReviewedAction(
  formData: FormData,
): Promise<void> {
  const { user } = await requireSession();
  const resumeId = String(formData.get("resumeId") ?? "");

  try {
    await markCandidateProfileReviewed({ userId: user.id, resumeId });
    revalidatePath("/cv-library");
    feedbackRedirect(`success=profile-reviewed&resumeId=${resumeId}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    feedbackRedirect("error=profile-review-failed");
  }
}

export async function getProfileForResumeAction(resumeId: string) {
  const { user } = await requireSession();
  return getCandidateProfileForResume({ userId: user.id, resumeId });
}
