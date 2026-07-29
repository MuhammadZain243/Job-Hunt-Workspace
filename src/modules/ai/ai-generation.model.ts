import "server-only";

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const aiGenerationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    applicationId: { type: String, required: true, index: true },
    purpose: {
      type: String,
      required: true,
      enum: ["job_match", "outreach_email", "linkedin_draft"],
    },
    provider: { type: String, required: true, default: "openai" },
    model: { type: String, required: true },
    promptVersion: { type: String, required: true },
    inputSourceRefs: { type: [String], default: [] },
    output: { type: Schema.Types.Mixed, required: true },
    warnings: { type: [String], default: [] },
    tokenUsage: {
      inputTokens: { type: Number, default: null },
      outputTokens: { type: Number, default: null },
      totalTokens: { type: Number, default: null },
    },
    reviewedAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
  },
  {
    collection: "ai_generations",
    timestamps: { createdAt: true, updatedAt: true },
    versionKey: false,
  },
);

aiGenerationSchema.index({
  userId: 1,
  applicationId: 1,
  purpose: 1,
  createdAt: -1,
});

export type AiGenerationLean = InferSchemaType<typeof aiGenerationSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type AiGenerationModelType = Model<AiGenerationLean>;

export const AiGenerationModel: AiGenerationModelType =
  (mongoose.models.AiGeneration as AiGenerationModelType | undefined) ??
  mongoose.model<AiGenerationLean>("AiGeneration", aiGenerationSchema);
