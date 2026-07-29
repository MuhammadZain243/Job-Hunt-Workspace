import "server-only";

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const providerConnectionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    provider: { type: String, required: true, enum: ["cloudinary", "s3"] },
    accountLabel: { type: String, required: true },
    externalAccountId: { type: String },
    scopes: { type: [String], default: [] },
    status: {
      type: String,
      required: true,
      enum: ["connected", "expired", "revoked", "error", "disconnected"],
      default: "connected",
    },
    expiresAt: { type: Date, default: null },
    lastCheckedAt: { type: Date, default: null },
    lastErrorCode: { type: String, default: null },
    credentialId: { type: String, required: true },
  },
  {
    collection: "provider_connections",
    timestamps: true,
    versionKey: false,
  },
);

providerConnectionSchema.index(
  { userId: 1, provider: 1, externalAccountId: 1 },
  { unique: true, sparse: true },
);
providerConnectionSchema.index({ userId: 1, provider: 1 }, { unique: true });

export type ProviderConnectionLean = InferSchemaType<
  typeof providerConnectionSchema
>;
export type ProviderConnectionModelType = Model<ProviderConnectionLean>;

export const ProviderConnectionModel: ProviderConnectionModelType =
  (mongoose.models.ProviderConnection as
    ProviderConnectionModelType | undefined) ??
  mongoose.model<ProviderConnectionLean>(
    "ProviderConnection",
    providerConnectionSchema,
  );
