import "server-only";

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const sourceRefSchema = new Schema(
  {
    sourceDocumentId: { type: String },
    sourceType: { type: String, required: true },
    sourceUrl: { type: String },
    collectedAt: { type: Date, required: true },
    fieldPath: { type: String },
    quoteHash: { type: String },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    reviewedByUser: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const emailStatusValues = [
  "unknown",
  "inferred",
  "verified",
  "bounced",
] as const;

const contactSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    fullName: { type: String, required: true, trim: true },
    title: { type: String, required: false, default: "" },
    department: { type: String, required: false, default: "" },
    email: { type: String, required: false, default: "", trim: true },
    emailStatus: {
      type: String,
      required: true,
      enum: emailStatusValues,
      default: "unknown",
    },
    linkedinUrl: { type: String, required: false, default: "" },
    source: { type: sourceRefSchema, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1, default: 0.5 },
    reviewedAt: { type: Date, default: null },
    suppressedAt: { type: Date, default: null },
  },
  {
    collection: "contacts",
    timestamps: true,
    versionKey: false,
  },
);

contactSchema.index({ userId: 1, companyId: 1, email: 1 });

export type ContactLean = InferSchemaType<typeof contactSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type ContactModelType = Model<ContactLean>;

export const ContactModel: ContactModelType =
  (mongoose.models.Contact as ContactModelType | undefined) ??
  mongoose.model<ContactLean>("Contact", contactSchema);
