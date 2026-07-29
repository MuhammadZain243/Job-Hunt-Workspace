"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { connectMongoose } from "@/lib/db/mongoose";
import { getServerEnv } from "@/lib/env/server";
import { isAppError } from "@/lib/errors/app-error";
import { recordAuditEvent } from "@/modules/audit/audit.service";
import {
  disconnectProviderConfiguration,
  listProviderConnections,
  saveProviderSecret,
} from "@/modules/credentials/credential.service";
import { AppSettingsModel } from "@/modules/settings/settings.model";
import {
  getOrCreateAppSettings,
  updateCvStorageProvider,
} from "@/modules/settings/settings.service";
import { cloudinaryCredentialsSchema } from "@/providers/storage/cloudinary/cloudinary.validation";
import { s3CredentialsSchema } from "@/providers/storage/s3/s3.validation";
import {
  createCloudinaryStorageProvider,
  createLocalStorageProvider,
  createS3StorageProvider,
} from "@/providers/storage/storage-provider.factory";

const providerSchema = z.object({
  provider: z.enum(["local", "cloudinary", "s3"]),
});

function revalidateSettings() {
  revalidatePath("/settings/storage");
  revalidatePath("/settings/openai");
}

async function fallbackProviderAfterDisconnect(
  userId: string,
  disconnected: "cloudinary" | "s3",
) {
  await connectMongoose();
  const settings = await getOrCreateAppSettings(userId);
  if (settings.cvStorageProvider !== disconnected) {
    return;
  }

  const connections = await listProviderConnections(userId);
  const otherHosted = disconnected === "cloudinary" ? "s3" : "cloudinary";
  const hasOther = connections.some(
    (connection) => connection.provider === otherHosted,
  );

  if (hasOther) {
    await AppSettingsModel.updateOne(
      { userId },
      { $set: { cvStorageProvider: otherHosted } },
    );
    return;
  }

  if (getServerEnv().NODE_ENV !== "production") {
    await AppSettingsModel.updateOne(
      { userId },
      { $set: { cvStorageProvider: "local" } },
    );
  }
}

export async function updateStorageProviderAction(
  formData: FormData,
): Promise<void> {
  const { user } = await requireSession();
  const parsed = providerSchema.safeParse({
    provider: formData.get("provider"),
  });

  if (!parsed.success) {
    redirect("/settings/storage?storageError=invalid-provider");
  }

  try {
    await updateCvStorageProvider(user.id, parsed.data.provider);
    revalidateSettings();
    redirect(`/settings/storage?storageSuccess=${parsed.data.provider}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (isAppError(error) && error.code === "POLICY_VIOLATION") {
      redirect("/settings/storage?storageError=local-production");
    }
    if (isAppError(error) && error.code === "VALIDATION_ERROR") {
      redirect("/settings/storage?storageError=not-connected");
    }
    redirect("/settings/storage?storageError=invalid-provider");
  }
}

export async function testLocalStorageAction(): Promise<void> {
  await requireSession();
  try {
    const provider = createLocalStorageProvider();
    const health = await provider.testConnection();
    redirect(
      `/settings/storage?localStatus=${encodeURIComponent(
        health.detail ? `${health.label}: ${health.detail}` : health.label,
      )}`,
    );
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect("/settings/storage?storageError=local-production");
  }
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
    redirect("/settings/storage?cloudinaryError=invalid-credentials");
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

    revalidateSettings();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect("/settings/storage?cloudinaryError=connection-failed");
  }

  redirect("/settings/storage?cloudinarySuccess=connected");
}

export async function saveS3ConnectionAction(
  formData: FormData,
): Promise<void> {
  const { user } = await requireSession();
  const parsed = s3CredentialsSchema.safeParse({
    endpoint: formData.get("endpoint") || undefined,
    region: formData.get("region"),
    bucket: formData.get("bucket"),
    accessKeyId: formData.get("accessKeyId"),
    secretAccessKey: formData.get("secretAccessKey"),
    forcePathStyle: formData.get("forcePathStyle") === "on",
  });

  if (!parsed.success) {
    redirect("/settings/storage?s3Error=invalid-credentials");
  }

  try {
    const provider = createS3StorageProvider(parsed.data);
    await provider.testConnection();

    await saveProviderSecret({
      userId: user.id,
      provider: "s3",
      accountLabel: parsed.data.bucket,
      secret: JSON.stringify(parsed.data),
      externalAccountId: parsed.data.bucket,
    });

    await updateCvStorageProvider(user.id, "s3");

    await recordAuditEvent({
      userId: user.id,
      action: "storage.s3.connected",
      entityType: "provider_connection",
      metadata: { provider: "s3" },
    });

    revalidateSettings();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect("/settings/storage?s3Error=connection-failed");
  }

  redirect("/settings/storage?s3Success=connected");
}

export async function disconnectCloudinaryAction(): Promise<void> {
  const { user } = await requireSession();

  try {
    await disconnectProviderConfiguration({
      userId: user.id,
      provider: "cloudinary",
    });
    await fallbackProviderAfterDisconnect(user.id, "cloudinary");

    await recordAuditEvent({
      userId: user.id,
      action: "storage.cloudinary.disconnected",
      entityType: "provider_connection",
      metadata: { provider: "cloudinary" },
    });

    revalidateSettings();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect("/settings/storage?disconnectError=cloudinary");
  }

  redirect("/settings/storage?disconnectSuccess=cloudinary");
}

export async function disconnectS3Action(): Promise<void> {
  const { user } = await requireSession();

  try {
    await disconnectProviderConfiguration({
      userId: user.id,
      provider: "s3",
    });
    await fallbackProviderAfterDisconnect(user.id, "s3");

    await recordAuditEvent({
      userId: user.id,
      action: "storage.s3.disconnected",
      entityType: "provider_connection",
      metadata: { provider: "s3" },
    });

    revalidateSettings();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect("/settings/storage?disconnectError=s3");
  }

  redirect("/settings/storage?disconnectSuccess=s3");
}

export async function saveOpenAiConnectionAction(
  formData: FormData,
): Promise<void> {
  const { user } = await requireSession();
  try {
    const { saveAndTestOpenAiConnection } =
      await import("@/modules/ai/ai-generation.service");
    await saveAndTestOpenAiConnection(
      user.id,
      String(formData.get("apiKey") ?? ""),
    );
    revalidateSettings();
    revalidatePath("/outreach");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (isAppError(error) && error.code === "PROVIDER_AUTH_ERROR") {
      redirect("/settings/openai?openaiError=invalid-key");
    }
    redirect("/settings/openai?openaiError=connection-failed");
  }

  redirect("/settings/openai?openaiSuccess=connected");
}

export async function disconnectOpenAiAction(): Promise<void> {
  const { user } = await requireSession();
  try {
    const { disconnectOpenAiConnection } =
      await import("@/modules/ai/ai-generation.service");
    await disconnectOpenAiConnection(user.id);
    revalidateSettings();
    revalidatePath("/outreach");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect("/settings/openai?disconnectError=openai");
  }

  redirect("/settings/openai?disconnectSuccess=openai");
}
