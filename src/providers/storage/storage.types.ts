import "server-only";

export type CvStorageProviderName = "cloudinary" | "s3" | "local";

export type ConnectionHealth = {
  ok: boolean;
  label: string;
  detail?: string;
  checkedAt: Date;
};

export type CreateCvUploadInput = {
  userId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

export type CvUploadIntent = {
  provider: CvStorageProviderName;
  uploadUrl?: string;
  fields?: Record<string, string>;
  storageKey?: string;
};

export type FinalizeCvUploadInput = {
  userId: string;
  uploadKey: string;
};

export type UploadCvObjectInput = {
  userId: string;
  fileName: string;
  contentType: string;
  bytes: Uint8Array;
};

export type StoredCvRef = {
  userId: string;
  storageKey: string;
  storageProvider: CvStorageProviderName;
  storageMetadata?: Record<string, string | number | boolean | null | undefined>;
};

export type StoredCvObject = {
  storageProvider: CvStorageProviderName;
  storageKey: string;
  storageMetadata: Record<string, string | number | boolean | null | undefined>;
};

export interface CvStorageProvider {
  readonly provider: CvStorageProviderName;
  createUploadIntent(input: CreateCvUploadInput): Promise<CvUploadIntent>;
  finalizeUpload(input: FinalizeCvUploadInput): Promise<StoredCvObject>;
  uploadObject(input: UploadCvObjectInput): Promise<StoredCvObject>;
  getFile(input: StoredCvRef): Promise<Uint8Array>;
  createDownloadUrl(
    input: StoredCvRef,
    expiresInSeconds: number,
  ): Promise<string>;
  deleteFile(input: StoredCvRef): Promise<void>;
  testConnection(): Promise<ConnectionHealth>;
}
