"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";
import { isAppError } from "@/lib/errors/app-error";
import {
  createCompany,
  deleteCompany,
  updateCompany,
} from "@/modules/companies/company.service";

function feedback(path: string, params: string): never {
  redirect(`${path}?${params}`);
}

export async function createCompanyAction(formData: FormData): Promise<void> {
  const { user } = await requireSession();
  try {
    const company = await createCompany(user.id, {
      name: String(formData.get("name") ?? ""),
      domain: String(formData.get("domain") ?? ""),
      websiteUrl: String(formData.get("websiteUrl") ?? ""),
      linkedinUrl: String(formData.get("linkedinUrl") ?? ""),
      industry: String(formData.get("industry") ?? ""),
      summary: String(formData.get("summary") ?? ""),
      sourceType: "manual",
      sourceUrl: String(formData.get("sourceUrl") ?? ""),
    });
    revalidatePath("/companies");
    revalidatePath("/dashboard");
    redirect(`/companies/${company.id}?success=created`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (isAppError(error) && error.code === "CONFLICT") {
      feedback("/companies", "error=duplicate");
    }
    feedback("/companies", "error=create-failed");
  }
}

export async function updateCompanyAction(formData: FormData): Promise<void> {
  const { user } = await requireSession();
  const companyId = String(formData.get("companyId") ?? "");
  try {
    await updateCompany(user.id, {
      companyId,
      name: String(formData.get("name") ?? ""),
      domain: String(formData.get("domain") ?? ""),
      websiteUrl: String(formData.get("websiteUrl") ?? ""),
      linkedinUrl: String(formData.get("linkedinUrl") ?? ""),
      industry: String(formData.get("industry") ?? ""),
      summary: String(formData.get("summary") ?? ""),
    });
    revalidatePath("/companies");
    revalidatePath(`/companies/${companyId}`);
    feedback(`/companies/${companyId}`, "success=updated");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (isAppError(error) && error.code === "CONFLICT") {
      feedback(`/companies/${companyId}`, "error=duplicate");
    }
    feedback(`/companies/${companyId}`, "error=update-failed");
  }
}

export async function deleteCompanyAction(formData: FormData): Promise<void> {
  const { user } = await requireSession();
  const companyId = String(formData.get("companyId") ?? "");
  try {
    await deleteCompany(user.id, companyId);
    revalidatePath("/companies");
    revalidatePath("/dashboard");
    feedback("/companies", "success=deleted");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    feedback("/companies", "error=delete-failed");
  }
}
