"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";
import {
  createContact,
  deleteContact,
  suppressContact,
} from "@/modules/contacts/contact.service";

function feedback(path: string, params: string): never {
  redirect(`${path}?${params}`);
}

export async function createContactAction(formData: FormData): Promise<void> {
  const { user } = await requireSession();
  const companyId = String(formData.get("companyId") ?? "");
  const returnTo = String(
    formData.get("returnTo") ?? `/companies/${companyId}`,
  );

  try {
    await createContact(user.id, {
      companyId,
      fullName: String(formData.get("fullName") ?? ""),
      title: String(formData.get("title") ?? ""),
      department: String(formData.get("department") ?? ""),
      email: String(formData.get("email") ?? ""),
      linkedinUrl: String(formData.get("linkedinUrl") ?? ""),
      sourceType: "manual",
      sourceUrl: String(formData.get("sourceUrl") ?? ""),
      confidence: Number(formData.get("confidence") ?? 0.8),
      emailStatus: String(formData.get("emailStatus") ?? "unknown"),
    });
    revalidatePath("/contacts");
    revalidatePath(`/companies/${companyId}`);
    feedback(returnTo, "success=contact-created");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    feedback(returnTo, "error=contact-create-failed");
  }
}

export async function suppressContactAction(formData: FormData): Promise<void> {
  const { user } = await requireSession();
  const contactId = String(formData.get("contactId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/contacts");
  try {
    await suppressContact(user.id, contactId);
    revalidatePath("/contacts");
    feedback(returnTo, "success=contact-suppressed");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    feedback(returnTo, "error=contact-suppress-failed");
  }
}

export async function deleteContactAction(formData: FormData): Promise<void> {
  const { user } = await requireSession();
  const contactId = String(formData.get("contactId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/contacts");
  try {
    await deleteContact(user.id, contactId);
    revalidatePath("/contacts");
    feedback(returnTo, "success=contact-deleted");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    feedback(returnTo, "error=contact-delete-failed");
  }
}
