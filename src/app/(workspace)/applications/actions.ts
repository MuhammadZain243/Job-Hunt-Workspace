"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";
import { isAppError } from "@/lib/errors/app-error";
import {
  createApplication,
  transitionApplication,
} from "@/modules/applications/application.service";

function feedback(path: string, params: string): never {
  redirect(`${path}?${params}`);
}

export async function createApplicationAction(
  formData: FormData,
): Promise<void> {
  const { user } = await requireSession();
  const jobId = String(formData.get("jobId") ?? "");
  try {
    const application = await createApplication(user.id, {
      jobId,
      resumeId: String(formData.get("resumeId") ?? ""),
      primaryContactId: String(formData.get("primaryContactId") ?? ""),
    });
    revalidatePath("/applications");
    revalidatePath("/dashboard");
    revalidatePath(`/jobs/${jobId}`);
    redirect(`/applications?success=created&applicationId=${application.id}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (isAppError(error) && error.code === "VALIDATION_ERROR") {
      feedback(`/jobs/${jobId}`, "error=role-required");
    }
    if (isAppError(error) && error.code === "CONFLICT") {
      feedback(`/jobs/${jobId}`, "error=application-exists");
    }
    feedback(`/jobs/${jobId}`, "error=application-failed");
  }
}

export async function transitionApplicationAction(
  formData: FormData,
): Promise<void> {
  const { user } = await requireSession();
  try {
    await transitionApplication(user.id, {
      applicationId: String(formData.get("applicationId") ?? ""),
      nextStatus: String(formData.get("nextStatus") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
    revalidatePath("/applications");
    revalidatePath("/dashboard");
    feedback("/applications", "success=status-updated");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    feedback("/applications", "error=status-failed");
  }
}
