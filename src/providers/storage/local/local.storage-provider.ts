import "server-only";

import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

import { getServerEnv } from "@/lib/env/server";
import type {
  ConnectionHealth,
  CreateCvUploadInput,
  CvStorageProvider,
  CvUploadIntent,
  FinalizeCvUploadInput,
  StoredCvObject,
  StoredCvRef,
} from "@/providers/storage/storage.types";

function getLocalStorageRoot(): string {
  return path.resolve(process.cwd(), getServerEnv().LOCAL_PRIVATE_STORAGE_PATH);
}

export class LocalCvStorageProvider implements CvStorageProvider {
  readonly provider = "local" as const;

  async createUploadIntent(_input: CreateCvUploadInput): Promise<CvUploadIntent> {
    await mkdir(getLocalStorageRoot(), { recursive: true });
    return { provider: this.provider };
  }

  async finalizeUpload(input: FinalizeCvUploadInput): Promise<StoredCvObject> {
    return {
      storageProvider: this.provider,
      storageKey: input.uploadKey,
      storageMetadata: {},
    };
  }

  async getFile(input: StoredCvRef): Promise<Uint8Array> {
    const fullPath = path.join(getLocalStorageRoot(), input.storageKey);
    return new Uint8Array(await readFile(fullPath));
  }

  async createDownloadUrl(input: StoredCvRef): Promise<string> {
    return `/api/resumes/${encodeURIComponent(input.storageKey)}/download`;
  }

  async deleteFile(input: StoredCvRef): Promise<void> {
    const fullPath = path.join(getLocalStorageRoot(), input.storageKey);
    await rm(fullPath, { force: true });
  }

  async testConnection(): Promise<ConnectionHealth> {
    await mkdir(getLocalStorageRoot(), { recursive: true });
    return {
      ok: true,
      label: "Local storage ready",
      detail: getLocalStorageRoot(),
      checkedAt: new Date(),
    };
  }
}
