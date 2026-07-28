import "server-only";

import { createCloudinaryClient } from "@/providers/storage/cloudinary/cloudinary.client";
import type { CloudinaryCredentialsInput } from "@/providers/storage/cloudinary/cloudinary.validation";
import type {
  ConnectionHealth,
  CreateCvUploadInput,
  CvStorageProvider,
  CvUploadIntent,
  FinalizeCvUploadInput,
  StoredCvObject,
  StoredCvRef,
} from "@/providers/storage/storage.types";

export class CloudinaryCvStorageProvider implements CvStorageProvider {
  readonly provider = "cloudinary" as const;

  constructor(private readonly credentials: CloudinaryCredentialsInput) {}

  async createUploadIntent(_input: CreateCvUploadInput): Promise<CvUploadIntent> {
    return { provider: this.provider };
  }

  async finalizeUpload(input: FinalizeCvUploadInput): Promise<StoredCvObject> {
    return {
      storageProvider: this.provider,
      storageKey: input.uploadKey,
      storageMetadata: {},
    };
  }

  async getFile(_input: StoredCvRef): Promise<Uint8Array> {
    throw new Error("Cloudinary file access is implemented in the upload phase.");
  }

  async createDownloadUrl(_input: StoredCvRef): Promise<string> {
    throw new Error("Cloudinary signed download URLs are implemented in the upload phase.");
  }

  async deleteFile(_input: StoredCvRef): Promise<void> {
    throw new Error("Cloudinary delete is implemented in the upload phase.");
  }

  async testConnection(): Promise<ConnectionHealth> {
    const client = createCloudinaryClient({
      cloud_name: this.credentials.cloudName,
      api_key: this.credentials.apiKey,
      api_secret: this.credentials.apiSecret,
      secure: true,
    });

    await client.api.ping();

    return {
      ok: true,
      label: "Cloudinary connected",
      detail: this.credentials.cloudName,
      checkedAt: new Date(),
    };
  }
}
