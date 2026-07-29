import "server-only";

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const sourceDocumentSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["manual_text", "url", "ats", "company_site", "uploaded_file"],
    },
    url: { type: String, required: false, default: "" },
    title: { type: String, required: false, default: "" },
    content: { type: String, required: true },
    contentHash: { type: String, required: true },
    provider: { type: String, required: false, default: "manual" },
    collectedAt: { type: Date, required: true },
    expiresAt: { type: Date, default: null },
    retentionClass: { type: String, required: false, default: "owner_data" },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    collection: "source_documents",
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

sourceDocumentSchema.index({ userId: 1, contentHash: 1 });

export type SourceDocumentLean = InferSchemaType<
  typeof sourceDocumentSchema
> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

export type SourceDocumentModelType = Model<SourceDocumentLean>;

export const SourceDocumentModel: SourceDocumentModelType =
  (mongoose.models.SourceDocument as SourceDocumentModelType | undefined) ??
  mongoose.model<SourceDocumentLean>("SourceDocument", sourceDocumentSchema);
