"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { recordAuditEvent } from "@/modules/audit/audit.service";
import {
  disconnectProviderConfiguration,
  saveProviderSecret,
} from "@/modules/credentials/credential.service";
import {
  getOrCreateAppSettings,
  updateCvStorageProvider,
} from "@/modules/settings/settings.service";
import { cloudinaryCredentialsSchema } from "@/providers/storage/cloudinary/cloudinary.validation";
import {
  createCloudinaryStorageProvider,
  createLocalStorageProvider,
} from "@/providers/storage/storage-provider.factory";

const providerSchema = z.object({
  provider: z.enum(["local", "cloudinary", "s3"]),
});

export async function updateStorageProviderAction(
  formData: FormData,
): Promise<void> {
  const { user } = await requireSession();
  const parsed = providerSchema.safeParse({
    provider: formData.get("provider"),
  });

  if (!parsed.success) {
    redirect("/settings?storageError=invalid-provider");
  }

  if (parsed.data.provider === "s3") {
    redirect("/settings?storageError=s3-pending");
  }

  await updateCvStorageProvider(user.id, parsed.data.provider);
  revalidatePath("/settings");
  redirect(`/settings?storageSuccess=${parsed.data.provider}`);
}

export async function testLocalStorageAction(): Promise<void> {
  await requireSession();
  const provider = createLocalStorageProvider();
  const health = await provider.testConnection();
  redirect(
    `/settings?localStatus=${encodeURIComponent(
      health.detail ? `${health.label}: ${health.detail}` : health.label,
    )}`,
  );
}

export async function saveCloudinaryConnectionAction(
  formData: FormData,
): Promise<void> {
  const { user } = await requireSession();
  const parsed = cloudinaryCredentialsSchema.safeParse({
    cloudName: formData.get("cloudName"),
    apiKey: formData.get("apiKey"),
    apiSecret: formData.get("apiSecret"),
  });

  if (!parsed.success) {
    redirect("/settings?cloudinaryError=invalid-credentials");
  }

  try {
    const provider = createCloudinaryStorageProvider(parsed.data);
    await provider.testConnection();

    await saveProviderSecret({
      userId: user.id,
      provider: "cloudinary",
      accountLabel: parsed.data.cloudName,
      secret: JSON.stringify(parsed.data),
      externalAccountId: parsed.data.cloudName,
    });

    await updateCvStorageProvider(user.id, "cloudinary");

    await recordAuditEvent({
      userId: user.id,
      action: "storage.cloudinary.connected",
      entityType: "provider_connection",
      metadata: { provider: "cloudinary" },
    });

    revalidatePath("/settings");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    redirect("/settings?cloudinaryError=connection-failed");
  }

  redirect("/settings?cloudinarySuccess=connected");
}

export async function disconnectCloudinaryAction(): Promise<void> {
  const { user } = await requireSession();

  try {
    await disconnectProviderConfiguration({
      userId: user.id,
      provider: "cloudinary",
    });

    const settings = await getOrCreateAppSettings(user.id);
    if (settings.cvStorageProvider === "cloudinary") {
      await updateCvStorageProvider(user.id, "local");
    }

    await recordAuditEvent({
      userId: user.id,
      action: "storage.cloudinary.disconnected",
      entityType: "provider_connection",
      metadata: { provider: "cloudinary" },
    });

    revalidatePath("/settings");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    redirect("/settings?disconnectError=cloudinary");
  }

  redirect("/settings?disconnectSuccess=cloudinary");
}
