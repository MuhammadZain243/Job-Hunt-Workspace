"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";
import { isAppError } from "@/lib/errors/app-error";
import {
  deleteJob,
  importManualJob,
  selectJobRole,
  updateJobReview,
} from "@/modules/jobs/job.service";

function feedback(path: string, params: string): never {
  redirect(`${path}?${params}`);
}

export async function importJobAction(formData: FormData): Promise<void> {
  const { user } = await requireSession();
  try {
    const job = await importManualJob(user.id, {
      companyId: String(formData.get("companyId") ?? ""),
      sourceUrl: String(formData.get("sourceUrl") ?? ""),
      pastedText: String(formData.get("pastedText") ?? ""),
      applicationUrl: String(formData.get("applicationUrl") ?? ""),
    });
    revalidatePath("/jobs");
    revalidatePath(`/companies/${job.companyId}`);
    revalidatePath("/dashboard");
    redirect(`/jobs/${job.id}?success=imported`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    feedback("/jobs", "error=import-failed");
  }
}

export async function selectJobRoleAction(formData: FormData): Promise<void> {
  const { user } = await requireSession();
  const jobId = String(formData.get("jobId") ?? "");
  try {
    await selectJobRole(user.id, {
      jobId,
      roleId: String(formData.get("roleId") ?? ""),
    });
    revalidatePath(`/jobs/${jobId}`);
    feedback(`/jobs/${jobId}`, "success=role-selected");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    feedback(`/jobs/${jobId}`, "error=role-failed");
  }
}

export async function updateJobReviewAction(formData: FormData): Promise<void> {
  const { user } = await requireSession();
  const jobId = String(formData.get("jobId") ?? "");
  try {
    await updateJobReview(user.id, {
      jobId,
      title: String(formData.get("title") ?? ""),
      location: String(formData.get("location") ?? ""),
      workplaceType: String(formData.get("workplaceType") ?? ""),
      employmentType: String(formData.get("employmentType") ?? ""),
      applicationUrl: String(formData.get("applicationUrl") ?? ""),
    });
    revalidatePath(`/jobs/${jobId}`);
    feedback(`/jobs/${jobId}`, "success=reviewed");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    feedback(`/jobs/${jobId}`, "error=review-failed");
  }
}

export async function deleteJobAction(formData: FormData): Promise<void> {
  const { user } = await requireSession();
  try {
    await deleteJob(user.id, String(formData.get("jobId") ?? ""));
    revalidatePath("/jobs");
    revalidatePath("/dashboard");
    feedback("/jobs", "success=deleted");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (isAppError(error)) {
      feedback("/jobs", "error=delete-failed");
    }
    feedback("/jobs", "error=delete-failed");
  }
}
