import "server-only";

import { Readable } from "node:stream";

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
  UploadCvObjectInput,
} from "@/providers/storage/storage.types";

type CloudinaryUploadResult = {
  public_id: string;
  asset_id?: string;
  version?: number;
  format?: string;
  bytes?: number;
  resource_type?: string;
  type?: string;
};

function getClient(credentials: CloudinaryCredentialsInput) {
  return createCloudinaryClient({
    cloud_name: credentials.cloudName,
    api_key: credentials.apiKey,
    api_secret: credentials.apiSecret,
    secure: true,
  });
}

function uploadOptions(userId: string) {
  return {
    resource_type: "raw" as const,
    type: "authenticated" as const,
    folder: `job-hunt/${userId}/resumes`,
    use_filename: false,
    unique_filename: true,
    overwrite: false,
    tags: ["cv", `user-${userId}`],
  };
}

export function getCloudinaryProtectedUploadOptions(userId: string) {
  return uploadOptions(userId);
}

export class CloudinaryCvStorageProvider implements CvStorageProvider {
  readonly provider = "cloudinary" as const;

  constructor(private readonly credentials: CloudinaryCredentialsInput) {}

  async createUploadIntent(input: CreateCvUploadInput): Promise<CvUploadIntent> {
    const client = getClient(this.credentials);
    const timestamp = Math.round(Date.now() / 1000);
    const options = uploadOptions(input.userId);
    const paramsToSign = {
      timestamp,
      folder: options.folder,
      type: options.type,
      tags: options.tags.join(","),
      unique_filename: "true",
      overwrite: "false",
      use_filename: "false",
    };
    const signature = client.utils.api_sign_request(
      paramsToSign,
      this.credentials.apiSecret,
    );

    return {
      provider: this.provider,
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.credentials.cloudName}/raw/upload`,
      fields: {
        api_key: this.credentials.apiKey,
        timestamp: String(timestamp),
        signature,
        folder: options.folder,
        type: options.type,
        tags: options.tags.join(","),
        unique_filename: "true",
        overwrite: "false",
        use_filename: "false",
      },
    };
  }

  async finalizeUpload(input: FinalizeCvUploadInput): Promise<StoredCvObject> {
    return {
      storageProvider: this.provider,
      storageKey: input.uploadKey,
      storageMetadata: {
        publicId: input.uploadKey,
        resourceType: "raw",
        deliveryType: "authenticated",
      },
    };
  }

  async uploadObject(input: UploadCvObjectInput): Promise<StoredCvObject> {
    const client = getClient(this.credentials);
    const options = uploadOptions(input.userId);

    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const stream = client.uploader.upload_stream(
        options,
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error("Cloudinary upload failed"));
            return;
          }
          resolve(uploadResult as CloudinaryUploadResult);
        },
      );
      Readable.from(Buffer.from(input.bytes)).pipe(stream);
    });

    if (result.resource_type !== "raw" || result.type !== "authenticated") {
      if (result.public_id) {
        await client.uploader.destroy(result.public_id, {
          resource_type: "raw",
          type: result.type ?? "upload",
        });
      }
      throw new Error("Cloudinary rejected public delivery for CV assets");
    }

    return {
      storageProvider: this.provider,
      storageKey: result.public_id,
      storageMetadata: {
        assetId: result.asset_id ?? null,
        publicId: result.public_id,
        version: result.version ?? null,
        format: result.format ?? null,
        resourceType: "raw",
        deliveryType: "authenticated",
        bytes: result.bytes ?? input.bytes.byteLength,
      },
    };
  }

  async getFile(input: StoredCvRef): Promise<Uint8Array> {
    const url = await this.createDownloadUrl(input, 60);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to download Cloudinary CV asset");
    }
    return new Uint8Array(await response.arrayBuffer());
  }

  async createDownloadUrl(
    input: StoredCvRef,
    expiresInSeconds: number,
  ): Promise<string> {
    const client = getClient(this.credentials);
    const expiresAt = Math.round(Date.now() / 1000) + expiresInSeconds;
    return client.url(input.storageKey, {
      resource_type: "raw",
      type: "authenticated",
      sign_url: true,
      secure: true,
      expires_at: expiresAt,
      attachment: true,
    });
  }

  async deleteFile(input: StoredCvRef): Promise<void> {
    const client = getClient(this.credentials);
    await client.uploader.destroy(input.storageKey, {
      resource_type: "raw",
      type: "authenticated",
      invalidate: true,
    });
  }

  async testConnection(): Promise<ConnectionHealth> {
    const client = getClient(this.credentials);
    await client.api.ping();

    return {
      ok: true,
      label: "Cloudinary connected",
      detail: this.credentials.cloudName,
      checkedAt: new Date(),
    };
  }
}
