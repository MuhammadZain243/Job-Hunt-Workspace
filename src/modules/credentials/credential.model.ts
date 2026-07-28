import "server-only";

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const encryptedCredentialSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    provider: { type: String, required: true, enum: ["cloudinary", "s3"] },
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    algorithm: { type: String, required: true, default: "aes-256-gcm" },
    keyVersion: { type: Number, required: true },
    secretFingerprint: { type: String, required: true },
    accountLabel: { type: String, required: true },
    rotatedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
  },
  {
    collection: "encrypted_credentials",
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

encryptedCredentialSchema.index({ userId: 1, provider: 1, revokedAt: 1 });

export type EncryptedCredentialLean = InferSchemaType<typeof encryptedCredentialSchema>;
export type EncryptedCredentialModelType = Model<EncryptedCredentialLean>;

export const EncryptedCredentialModel: EncryptedCredentialModelType =
  (mongoose.models.EncryptedCredential as EncryptedCredentialModelType | undefined) ??
  mongoose.model<EncryptedCredentialLean>(
    "EncryptedCredential",
    encryptedCredentialSchema,
  );
