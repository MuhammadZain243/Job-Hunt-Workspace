import "server-only";

import { LocalCvStorageProvider } from "@/providers/storage/local/local.storage-provider";
import { CloudinaryCvStorageProvider } from "@/providers/storage/cloudinary/cloudinary.storage-provider";
import type { CloudinaryCredentialsInput } from "@/providers/storage/cloudinary/cloudinary.validation";
import type { CvStorageProvider } from "@/providers/storage/storage.types";

export function createLocalStorageProvider(): CvStorageProvider {
  return new LocalCvStorageProvider();
}

export function createCloudinaryStorageProvider(
  credentials: CloudinaryCredentialsInput,
): CvStorageProvider {
  return new CloudinaryCvStorageProvider(credentials);
}
