import "server-only";

import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { S3CredentialsInput } from "@/providers/storage/s3/s3.validation";
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

function createS3Client(credentials: S3CredentialsInput) {
  return new S3Client({
    region: credentials.region,
    endpoint: credentials.endpoint || undefined,
    forcePathStyle: credentials.forcePathStyle,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  });
}

function objectKey(userId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `job-hunt/${userId}/resumes/${randomUUID()}-${safeName}`;
}

export class S3CvStorageProvider implements CvStorageProvider {
  readonly provider = "s3" as const;

  constructor(private readonly credentials: S3CredentialsInput) {}

  async createUploadIntent(input: CreateCvUploadInput): Promise<CvUploadIntent> {
    const client = createS3Client(this.credentials);
    const storageKey = objectKey(input.userId, input.fileName);
    const command = new PutObjectCommand({
      Bucket: this.credentials.bucket,
      Key: storageKey,
      ContentType: input.contentType,
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 600 });
    return {
      provider: this.provider,
      uploadUrl,
      storageKey,
    };
  }

  async finalizeUpload(input: FinalizeCvUploadInput): Promise<StoredCvObject> {
    return {
      storageProvider: this.provider,
      storageKey: input.uploadKey,
      storageMetadata: {
        bucket: this.credentials.bucket,
      },
    };
  }

  async uploadObject(input: UploadCvObjectInput): Promise<StoredCvObject> {
    const client = createS3Client(this.credentials);
    const storageKey = objectKey(input.userId, input.fileName);
    await client.send(
      new PutObjectCommand({
        Bucket: this.credentials.bucket,
        Key: storageKey,
        Body: Buffer.from(input.bytes),
        ContentType: input.contentType,
      }),
    );

    return {
      storageProvider: this.provider,
      storageKey,
      storageMetadata: {
        bucket: this.credentials.bucket,
        bytes: input.bytes.byteLength,
      },
    };
  }

  async getFile(input: StoredCvRef): Promise<Uint8Array> {
    const client = createS3Client(this.credentials);
    const result = await client.send(
      new GetObjectCommand({
        Bucket: this.credentials.bucket,
        Key: input.storageKey,
      }),
    );
    const bytes = await result.Body?.transformToByteArray();
    if (!bytes) {
      throw new Error("S3 object body was empty");
    }
    return bytes;
  }

  async createDownloadUrl(
    input: StoredCvRef,
    expiresInSeconds: number,
  ): Promise<string> {
    const client = createS3Client(this.credentials);
    return getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: this.credentials.bucket,
        Key: input.storageKey,
      }),
      { expiresIn: expiresInSeconds },
    );
  }

  async deleteFile(input: StoredCvRef): Promise<void> {
    const client = createS3Client(this.credentials);
    await client.send(
      new DeleteObjectCommand({
        Bucket: this.credentials.bucket,
        Key: input.storageKey,
      }),
    );
  }

  async testConnection(): Promise<ConnectionHealth> {
    const client = createS3Client(this.credentials);
    await client.send(
      new HeadBucketCommand({
        Bucket: this.credentials.bucket,
      }),
    );

    return {
      ok: true,
      label: "S3 connected",
      detail: this.credentials.bucket,
      checkedAt: new Date(),
    };
  }
}
