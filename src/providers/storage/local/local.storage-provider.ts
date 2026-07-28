import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { PolicyViolationError, ValidationError } from "@/lib/errors/app-error";
import { getServerEnv } from "@/lib/env/server";
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

function getLocalStorageRoot(): string {
  return path.resolve(process.cwd(), getServerEnv().LOCAL_PRIVATE_STORAGE_PATH);
}

function assertSafeRelativeKey(storageKey: string): string {
  if (
    !storageKey ||
    storageKey.includes("\0") ||
    path.isAbsolute(storageKey) ||
    storageKey.split(/[/\\]/).some((part) => part === "..")
  ) {
    throw new ValidationError("Invalid storage key");
  }

  const root = getLocalStorageRoot();
  const fullPath = path.resolve(root, storageKey);
  if (!fullPath.startsWith(root + path.sep) && fullPath !== root) {
    throw new ValidationError("Invalid storage key");
  }

  return fullPath;
}

function assertLocalAllowed(): void {
  if (getServerEnv().NODE_ENV === "production") {
    throw new PolicyViolationError(
      "Local CV storage is not allowed in production",
    );
  }
}

export class LocalCvStorageProvider implements CvStorageProvider {
  readonly provider = "local" as const;

  async createUploadIntent(input: CreateCvUploadInput): Promise<CvUploadIntent> {
    assertLocalAllowed();
    await mkdir(getLocalStorageRoot(), { recursive: true });
    const extension = path.extname(input.fileName).toLowerCase() || ".bin";
    const storageKey = path.posix.join(
      input.userId,
      "resumes",
      `${randomUUID()}${extension}`,
    );
    return { provider: this.provider, storageKey };
  }

  async finalizeUpload(input: FinalizeCvUploadInput): Promise<StoredCvObject> {
    assertLocalAllowed();
    assertSafeRelativeKey(input.uploadKey);
    return {
      storageProvider: this.provider,
      storageKey: input.uploadKey,
      storageMetadata: {},
    };
  }

  async uploadObject(input: UploadCvObjectInput): Promise<StoredCvObject> {
    assertLocalAllowed();
    const intent = await this.createUploadIntent({
      userId: input.userId,
      fileName: input.fileName,
      contentType: input.contentType,
      sizeBytes: input.bytes.byteLength,
    });

    const storageKey = intent.storageKey!;
    const fullPath = assertSafeRelativeKey(storageKey);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, Buffer.from(input.bytes));

    return {
      storageProvider: this.provider,
      storageKey,
      storageMetadata: {
        bytes: input.bytes.byteLength,
      },
    };
  }

  async getFile(input: StoredCvRef): Promise<Uint8Array> {
    assertLocalAllowed();
    const fullPath = assertSafeRelativeKey(input.storageKey);
    return new Uint8Array(await readFile(fullPath));
  }

  async createDownloadUrl(
    input: StoredCvRef,
    expiresInSeconds: number,
  ): Promise<string> {
    assertLocalAllowed();
    assertSafeRelativeKey(input.storageKey);
    void expiresInSeconds;
    return `/api/resumes/download?key=${encodeURIComponent(input.storageKey)}`;
  }

  async deleteFile(input: StoredCvRef): Promise<void> {
    assertLocalAllowed();
    const fullPath = assertSafeRelativeKey(input.storageKey);
    await rm(fullPath, { force: true });
  }

  async testConnection(): Promise<ConnectionHealth> {
    assertLocalAllowed();
    await mkdir(getLocalStorageRoot(), { recursive: true });
    return {
      ok: true,
      label: "Local storage ready",
      detail: "Development private upload path",
      checkedAt: new Date(),
    };
  }
}
