"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";
import { isAppError } from "@/lib/errors/app-error";
import {
  acceptGeneration,
  generateJobMatch,
  generateLinkedInDraft,
  generateOutreachEmail,
} from "@/modules/ai/ai-generation.service";
import {
  linkedInDraftOutputSchema,
  outreachEmailOutputSchema,
} from "@/modules/ai/ai.schemas";

function feedback(params: string): never {
  redirect(`/outreach?${params}`);
}

export async function generateJobMatchAction(
  formData: FormData,
): Promise<void> {
  const { user } = await requireSession();
  const applicationId = String(formData.get("applicationId") ?? "");
  try {
    await generateJobMatch(user.id, applicationId);
    revalidatePath("/outreach");
    feedback(`applicationId=${applicationId}&success=job-match`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (isAppError(error)) {
      feedback(
        `applicationId=${applicationId}&error=${encodeURIComponent(error.code.toLowerCase())}&detail=${encodeURIComponent(error.message)}`,
      );
    }
    feedback(`applicationId=${applicationId}&error=generate-failed`);
  }
}

export async function generateOutreachEmailAction(
  formData: FormData,
): Promise<void> {
  const { user } = await requireSession();
  const applicationId = String(formData.get("applicationId") ?? "");
  try {
    await generateOutreachEmail(user.id, applicationId);
    revalidatePath("/outreach");
    feedback(`applicationId=${applicationId}&success=email-draft`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (isAppError(error)) {
      feedback(
        `applicationId=${applicationId}&error=${encodeURIComponent(error.code.toLowerCase())}&detail=${encodeURIComponent(error.message)}`,
      );
    }
    feedback(`applicationId=${applicationId}&error=generate-failed`);
  }
}

export async function generateLinkedInDraftAction(
  formData: FormData,
): Promise<void> {
  const { user } = await requireSession();
  const applicationId = String(formData.get("applicationId") ?? "");
  try {
    await generateLinkedInDraft(user.id, applicationId);
    revalidatePath("/outreach");
    feedback(`applicationId=${applicationId}&success=linkedin-draft`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (isAppError(error)) {
      feedback(
        `applicationId=${applicationId}&error=${encodeURIComponent(error.code.toLowerCase())}&detail=${encodeURIComponent(error.message)}`,
      );
    }
    feedback(`applicationId=${applicationId}&error=generate-failed`);
  }
}

export async function acceptOutreachEmailAction(
  formData: FormData,
): Promise<void> {
  const { user } = await requireSession();
  const applicationId = String(formData.get("applicationId") ?? "");
  const generationId = String(formData.get("generationId") ?? "");
  try {
    const edited = outreachEmailOutputSchema.parse({
      subject: String(formData.get("subject") ?? ""),
      plainText: String(formData.get("plainText") ?? ""),
      html: String(formData.get("html") ?? ""),
      coverLetterPlainText: String(formData.get("coverLetterPlainText") ?? ""),
      factsUsed: JSON.parse(String(formData.get("factsUsed") ?? "[]")),
      warnings: JSON.parse(String(formData.get("warnings") ?? "[]")),
      missingInformation: JSON.parse(
        String(formData.get("missingInformation") ?? "[]"),
      ),
    });
    await acceptGeneration({
      userId: user.id,
      generationId,
      editedOutput: edited,
    });
    revalidatePath("/outreach");
    feedback(`applicationId=${applicationId}&success=accepted`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    feedback(`applicationId=${applicationId}&error=accept-failed`);
  }
}

export async function acceptLinkedInDraftAction(
  formData: FormData,
): Promise<void> {
  const { user } = await requireSession();
  const applicationId = String(formData.get("applicationId") ?? "");
  const generationId = String(formData.get("generationId") ?? "");
  try {
    const edited = linkedInDraftOutputSchema.parse({
      connectionNote: String(formData.get("connectionNote") ?? ""),
      message: String(formData.get("message") ?? ""),
      factsUsed: JSON.parse(String(formData.get("factsUsed") ?? "[]")),
      warnings: JSON.parse(String(formData.get("warnings") ?? "[]")),
      missingInformation: JSON.parse(
        String(formData.get("missingInformation") ?? "[]"),
      ),
    });
    await acceptGeneration({
      userId: user.id,
      generationId,
      editedOutput: edited,
    });
    revalidatePath("/outreach");
    feedback(`applicationId=${applicationId}&success=accepted`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    feedback(`applicationId=${applicationId}&error=accept-failed`);
  }
}
