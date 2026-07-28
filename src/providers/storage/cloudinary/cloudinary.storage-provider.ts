import "server-only";

import path from "node:path";

import { ProviderUnavailableError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logger/logger";
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

const PROTECTED_DELIVERY_TYPES = new Set(["authenticated", "private"]);

function getClient(credentials: CloudinaryCredentialsInput) {
  return createCloudinaryClient({
    cloud_name: credentials.cloudName,
    api_key: credentials.apiKey,
    api_secret: credentials.apiSecret,
    secure: true,
  });
}

function sanitizeFolderSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) || "owner";
}

function uploadOptions(userId: string, fileName?: string) {
  const extension = fileName
    ? path.extname(fileName).replace(".", "").toLowerCase()
    : "";

  return {
    resource_type: "raw" as const,
    type: "authenticated" as const,
    folder: `job-hunt/${sanitizeFolderSegment(userId)}/resumes`,
    use_filename: false,
    unique_filename: true,
    overwrite: false,
    tags: ["cv", `user-${sanitizeFolderSegment(userId)}`],
    ...(extension ? { format: extension } : {}),
  };
}

export function getCloudinaryProtectedUploadOptions(userId: string) {
  return uploadOptions(userId);
}

function resolveDownloadTarget(
  storageKey: string,
  metadata?: StoredCvRef["storageMetadata"],
) {
  // Cloudinary stores raw public_ids with the extension included when format is set
  // on upload (e.g. ".../abc123.pdf"). Always download with that exact public_id.
  const metaFormat =
    typeof metadata?.format === "string" && metadata.format
      ? metadata.format.replace(/^\./, "").toLowerCase()
      : "";

  const extension = path.extname(storageKey).replace(".", "").toLowerCase();

  return {
    publicId: storageKey,
    format: metaFormat || extension || "",
  };
}

function toProviderError(error: unknown, fallback: string): ProviderUnavailableError {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : fallback;

  logger.warn(
    {
      provider: "cloudinary",
      reason: message.slice(0, 200),
    },
    fallback,
  );

  return new ProviderUnavailableError(fallback);
}

export class CloudinaryCvStorageProvider implements CvStorageProvider {
  readonly provider = "cloudinary" as const;

  constructor(private readonly credentials: CloudinaryCredentialsInput) {}

  async createUploadIntent(input: CreateCvUploadInput): Promise<CvUploadIntent> {
    const client = getClient(this.credentials);
    const timestamp = Math.round(Date.now() / 1000);
    const options = uploadOptions(input.userId, input.fileName);
    const paramsToSign: Record<string, string> = {
      timestamp: String(timestamp),
      folder: options.folder,
      type: options.type,
      tags: options.tags.join(","),
      unique_filename: "true",
      overwrite: "false",
      use_filename: "false",
    };
    if (options.format) {
      paramsToSign.format = options.format;
    }
    const signature = client.utils.api_sign_request(
      paramsToSign,
      this.credentials.apiSecret,
    );

    return {
      provider: this.provider,
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.credentials.cloudName}/raw/upload`,
      fields: {
        api_key: this.credentials.apiKey,
        ...paramsToSign,
        signature,
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
    const buffer = Buffer.from(input.bytes);

    const tryUpload = async (deliveryType: "authenticated" | "private") => {
      const options = {
        ...uploadOptions(input.userId, input.fileName),
        type: deliveryType,
      };

      return new Promise<CloudinaryUploadResult>((resolve, reject) => {
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
        stream.end(buffer);
      });
    };

    let result: CloudinaryUploadResult;
    try {
      result = await tryUpload("authenticated");
    } catch (authenticatedError) {
      try {
        result = await tryUpload("private");
      } catch {
        throw toProviderError(
          authenticatedError,
          "Cloudinary could not store the CV. Check the connection and try again.",
        );
      }
    }

    const deliveryType = result.type ?? "upload";
    if (
      result.resource_type !== "raw" ||
      !PROTECTED_DELIVERY_TYPES.has(deliveryType)
    ) {
      if (result.public_id) {
        try {
          await client.uploader.destroy(result.public_id, {
            resource_type: "raw",
            type: deliveryType,
          });
        } catch {
          // Best-effort cleanup of an unsafe asset.
        }
      }
      throw new ProviderUnavailableError(
        "Cloudinary did not store the CV as a protected raw asset",
      );
    }

    return {
      storageProvider: this.provider,
      storageKey: result.public_id,
      storageMetadata: {
        assetId: result.asset_id ?? null,
        publicId: result.public_id,
        version: result.version ?? null,
        format: result.format ?? (path.extname(input.fileName).slice(1) || null),
        resourceType: "raw",
        deliveryType,
        bytes: result.bytes ?? input.bytes.byteLength,
      },
    };
  }

  async getFile(input: StoredCvRef): Promise<Uint8Array> {
    const url = await this.createDownloadUrl(input, 120);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return new Uint8Array(await response.arrayBuffer());
    } catch (error) {
      throw toProviderError(error, "Failed to download Cloudinary CV asset");
    }
  }

  async createDownloadUrl(
    input: StoredCvRef,
    expiresInSeconds: number,
  ): Promise<string> {
    const client = getClient(this.credentials);
    const deliveryType =
      typeof input.storageMetadata?.deliveryType === "string" &&
      PROTECTED_DELIVERY_TYPES.has(input.storageMetadata.deliveryType)
        ? input.storageMetadata.deliveryType
        : "authenticated";
    const { publicId, format } = resolveDownloadTarget(
      input.storageKey,
      input.storageMetadata,
    );
    const expiresAt = Math.round(Date.now() / 1000) + expiresInSeconds;

    return client.utils.private_download_url(publicId, format, {
      resource_type: "raw",
      type: deliveryType,
      expires_at: expiresAt,
      attachment: true,
    });
  }

  async deleteFile(input: StoredCvRef): Promise<void> {
    const client = getClient(this.credentials);
    const deliveryType =
      typeof input.storageMetadata?.deliveryType === "string"
        ? input.storageMetadata.deliveryType
        : "authenticated";

    // Cloudinary destroy expects the stored public_id as saved (including path).
    await client.uploader.destroy(input.storageKey, {
      resource_type: "raw",
      type: deliveryType,
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
