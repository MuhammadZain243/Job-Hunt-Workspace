import "server-only";

import { PolicyViolationError, ValidationError } from "@/lib/errors/app-error";
import { getServerEnv } from "@/lib/env/server";
import { getProviderSecret } from "@/modules/credentials/credential.service";
import { getOrCreateAppSettings } from "@/modules/settings/settings.service";
import { CloudinaryCvStorageProvider } from "@/providers/storage/cloudinary/cloudinary.storage-provider";
import { cloudinaryCredentialsSchema } from "@/providers/storage/cloudinary/cloudinary.validation";
import { LocalCvStorageProvider } from "@/providers/storage/local/local.storage-provider";
import { S3CvStorageProvider } from "@/providers/storage/s3/s3.storage-provider";
import { s3CredentialsSchema } from "@/providers/storage/s3/s3.validation";
import type {
  CvStorageProvider,
  CvStorageProviderName,
} from "@/providers/storage/storage.types";

export function createLocalStorageProvider(): CvStorageProvider {
  if (getServerEnv().NODE_ENV === "production") {
    throw new PolicyViolationError(
      "Local CV storage is not allowed in production",
    );
  }
  return new LocalCvStorageProvider();
}

export function createCloudinaryStorageProvider(
  credentials: ReturnType<typeof cloudinaryCredentialsSchema.parse>,
): CvStorageProvider {
  return new CloudinaryCvStorageProvider(credentials);
}

export function createS3StorageProvider(
  credentials: ReturnType<typeof s3CredentialsSchema.parse>,
): CvStorageProvider {
  return new S3CvStorageProvider(credentials);
}

export async function getActiveCvStorageProvider(
  userId: string,
): Promise<CvStorageProvider> {
  const settings = await getOrCreateAppSettings(userId);
  return getCvStorageProviderForName(userId, settings.cvStorageProvider);
}

export async function getCvStorageProviderForName(
  userId: string,
  provider: CvStorageProviderName,
): Promise<CvStorageProvider> {
  if (provider === "local") {
    return createLocalStorageProvider();
  }

  if (provider === "cloudinary") {
    const secret = await getProviderSecret({ userId, provider: "cloudinary" });
    if (!secret) {
      throw new ValidationError("Cloudinary is not connected");
    }
    const parsed = cloudinaryCredentialsSchema.parse(JSON.parse(secret));
    return createCloudinaryStorageProvider(parsed);
  }

  const secret = await getProviderSecret({ userId, provider: "s3" });
  if (!secret) {
    throw new ValidationError("S3 is not connected");
  }
  const parsed = s3CredentialsSchema.parse(JSON.parse(secret));
  return createS3StorageProvider(parsed);
}
