import "server-only";

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

import { verificationStatusValues } from "@/modules/shared/source.types";

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

const companySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, trim: true },
    domain: { type: String, required: false, default: "", trim: true },
    websiteUrl: { type: String, required: false, default: "", trim: true },
    linkedinUrl: { type: String, required: false, default: "", trim: true },
    locations: { type: [String], default: [] },
    industry: { type: String, required: false, default: "" },
    sizeRange: { type: String, required: false, default: "" },
    summary: { type: String, required: false, default: "" },
    technologies: { type: [String], default: [] },
    sources: { type: [sourceRefSchema], default: [] },
    verificationStatus: {
      type: String,
      required: true,
      enum: verificationStatusValues,
      default: "unverified",
    },
  },
  {
    collection: "companies",
    timestamps: true,
    versionKey: false,
  },
);

companySchema.index(
  { userId: 1, normalizedName: 1 },
  {
    unique: true,
    partialFilterExpression: { normalizedName: { $type: "string" } },
  },
);
companySchema.index(
  { userId: 1, domain: 1 },
  {
    unique: true,
    partialFilterExpression: { domain: { $type: "string", $gt: "" } },
  },
);

export type CompanyLean = InferSchemaType<typeof companySchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type CompanyModelType = Model<CompanyLean>;

export const CompanyModel: CompanyModelType =
  (mongoose.models.Company as CompanyModelType | undefined) ??
  mongoose.model<CompanyLean>("Company", companySchema);
