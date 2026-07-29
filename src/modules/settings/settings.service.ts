import "server-only";

import { connectMongoose } from "@/lib/db/mongoose";
import { getServerEnv } from "@/lib/env/server";
import { PolicyViolationError, ValidationError } from "@/lib/errors/app-error";
import { listProviderConnections } from "@/modules/credentials/credential.service";
import { ResumeModel } from "@/modules/resumes/resume.model";
import { AppSettingsModel } from "@/modules/settings/settings.model";
import type { CvStorageProviderName } from "@/providers/storage/storage.types";

export async function getOrCreateAppSettings(userId: string) {
  await connectMongoose();

  const settings = await AppSettingsModel.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();

  return settings;
}

export async function updateCvStorageProvider(
  userId: string,
  provider: CvStorageProviderName,
) {
  await connectMongoose();

  if (provider === "local" && getServerEnv().NODE_ENV === "production") {
    throw new PolicyViolationError(
      "Local CV storage is not allowed in production",
    );
  }

  if (provider === "cloudinary" || provider === "s3") {
    const connections = await listProviderConnections(userId);
    const connected = connections.some(
      (connection) =>
        connection.provider === provider && connection.status === "connected",
    );
    if (!connected) {
      throw new ValidationError(
        `Connect ${provider} before setting it as the active provider`,
      );
    }
  }

  return AppSettingsModel.findOneAndUpdate(
    { userId },
    { cvStorageProvider: provider },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();
}

export async function getStorageSettingsView(userId: string) {
  await connectMongoose();
  const [settings, connections, resumeCount] = await Promise.all([
    getOrCreateAppSettings(userId),
    listProviderConnections(userId),
    ResumeModel.countDocuments({ userId }),
  ]);

  return {
    activeProvider: settings.cvStorageProvider as CvStorageProviderName,
    defaultCvId: settings.defaultCvId ?? null,
    isProduction: getServerEnv().NODE_ENV === "production",
    connections,
    resumeCount,
  };
}
