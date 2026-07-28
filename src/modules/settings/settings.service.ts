import "server-only";

import { connectMongoose } from "@/lib/db/mongoose";
import { AppSettingsModel } from "@/modules/settings/settings.model";
import { listProviderConnections } from "@/modules/credentials/credential.service";

export async function getOrCreateAppSettings(userId: string) {
  await connectMongoose();

  const settings = await AppSettingsModel.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();

  return settings;
}

export async function updateCvStorageProvider(userId: string, provider: "local" | "cloudinary" | "s3") {
  await connectMongoose();

  return AppSettingsModel.findOneAndUpdate(
    { userId },
    { cvStorageProvider: provider },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();
}

export async function getStorageSettingsView(userId: string) {
  const [settings, connections] = await Promise.all([
    getOrCreateAppSettings(userId),
    listProviderConnections(userId),
  ]);

  return {
    activeProvider: settings.cvStorageProvider,
    connections,
  };
}
