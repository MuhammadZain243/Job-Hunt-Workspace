import "server-only";

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const roleOptionSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    selected: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const sourcedFactSchema = new Schema(
  {
    field: { type: String, required: true },
    value: { type: String, required: true },
    sourceType: { type: String, required: true },
    sourceUrl: { type: String },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    reviewedByUser: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const jobSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    sourceId: { type: String, required: true },
    sourceUrl: { type: String, required: false, default: "" },
    externalId: { type: String, required: false, default: "" },
    title: { type: String, required: true, trim: true },
    roleOptions: { type: [roleOptionSchema], default: [] },
    selectedRoleId: { type: String, required: false, default: null },
    description: { type: String, required: false, default: "" },
    requirements: { type: [String], default: [] },
    responsibilities: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    location: { type: String, required: false, default: "" },
    workplaceType: { type: String, required: false, default: "" },
    employmentType: { type: String, required: false, default: "" },
    postedAt: { type: Date, default: null },
    closesAt: { type: Date, default: null },
    applicationUrl: { type: String, required: false, default: "" },
    contactIds: { type: [String], default: [] },
    status: {
      type: String,
      required: true,
      enum: ["active", "closed", "unknown"],
      default: "active",
    },
    facts: { type: [sourcedFactSchema], default: [] },
    extractionWarnings: { type: [String], default: [] },
  },
  {
    collection: "jobs",
    timestamps: true,
    versionKey: false,
  },
);

jobSchema.index({ userId: 1, companyId: 1, createdAt: -1 });
jobSchema.index({ userId: 1, externalId: 1, sourceId: 1 });

export type JobLean = InferSchemaType<typeof jobSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type JobModelType = Model<JobLean>;

export const JobModel: JobModelType =
  (mongoose.models.Job as JobModelType | undefined) ??
  mongoose.model<JobLean>("Job", jobSchema);
