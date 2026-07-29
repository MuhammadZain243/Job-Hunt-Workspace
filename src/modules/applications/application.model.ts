import "server-only";

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

import { applicationStatusValues } from "@/modules/applications/application.transitions";

const statusHistorySchema = new Schema(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    at: { type: Date, required: true },
    reason: { type: String, required: false, default: "" },
    actor: { type: String, required: true, default: "owner" },
  },
  { _id: false },
);

const applicationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    jobId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    targetRole: { type: String, required: true, trim: true },
    resumeId: { type: String, required: false, default: null },
    primaryContactId: { type: String, required: false, default: null },
    status: {
      type: String,
      required: true,
      enum: applicationStatusValues,
      default: "discovered",
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    appliedAt: { type: Date, default: null },
    hrContactedAt: { type: Date, default: null },
    nextAction: { type: String, required: false, default: "" },
    nextActionAt: { type: Date, default: null },
    activeSequenceId: { type: String, required: false, default: null },
    version: { type: Number, required: true, default: 1 },
  },
  {
    collection: "applications",
    timestamps: true,
    versionKey: false,
  },
);

applicationSchema.index(
  { userId: 1, jobId: 1, targetRole: 1 },
  { unique: true },
);

export type ApplicationLean = InferSchemaType<typeof applicationSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type ApplicationModelType = Model<ApplicationLean>;

export const ApplicationModel: ApplicationModelType =
  (mongoose.models.Application as ApplicationModelType | undefined) ??
  mongoose.model<ApplicationLean>("Application", applicationSchema);
