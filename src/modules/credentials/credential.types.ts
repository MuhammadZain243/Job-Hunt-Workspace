export type StoredCredentialProvider = "cloudinary" | "s3";

export type EncryptedCredentialSummary = {
  credentialId: string;
  provider: StoredCredentialProvider;
  accountLabel: string;
  fingerprint: string;
  createdAt: Date;
  rotatedAt?: Date | null;
};

export type ProviderConnectionStatus =
  | "connected"
  | "expired"
  | "revoked"
  | "error"
  | "disconnected";
