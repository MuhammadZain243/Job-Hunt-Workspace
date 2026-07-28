import "server-only";

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const extractionStatusValues = [
  "pending",
  "processing",
  "succeeded",
  "failed",
] as const;

const resumeSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    storageProvider: {
      type: String,
      required: true,
      enum: ["local", "cloudinary", "s3"],
    },
    storageKey: {
      type: String,
      required: true,
    },
    storageMetadata: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    originalFileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 1,
    },
    sha256: {
      type: String,
      required: true,
    },
    extractedText: {
      type: String,
      required: false,
      default: "",
    },
    extractionStatus: {
      type: String,
      required: true,
      enum: extractionStatusValues,
      default: "pending",
    },
    extractionError: {
      type: String,
      required: false,
      default: null,
    },
    isDefault: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    collection: "resumes",
    timestamps: true,
    versionKey: false,
  },
);

resumeSchema.index({ userId: 1, sha256: 1 }, { unique: true });
resumeSchema.index({ userId: 1, isDefault: 1 });
resumeSchema.index({ userId: 1, updatedAt: -1 });

export type ResumeLean = InferSchemaType<typeof resumeSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type ResumeModelType = Model<ResumeLean>;

export const ResumeModel: ResumeModelType =
  (mongoose.models.Resume as ResumeModelType | undefined) ??
  mongoose.model<ResumeLean>("Resume", resumeSchema);
