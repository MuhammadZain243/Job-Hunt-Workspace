import "server-only";

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const evidenceSchema = new Schema(
  {
    source: {
      type: String,
      required: true,
      enum: ["cv_text", "user_confirmed"],
    },
    excerpt: {
      type: String,
      required: false,
      default: "",
    },
  },
  { _id: false },
);

const candidateProfileSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    resumeId: {
      type: String,
      required: true,
      index: true,
    },
    headline: {
      type: String,
      required: false,
      default: "",
    },
    summary: {
      type: String,
      required: false,
      default: "",
    },
    contact: {
      email: { type: String, required: false, default: "" },
      phone: { type: String, required: false, default: "" },
      location: { type: String, required: false, default: "" },
      linkedinUrl: { type: String, required: false, default: "" },
    },
    skills: {
      type: [
        {
          name: String,
          category: { type: String, default: "general" },
          evidence: evidenceSchema,
        },
      ],
      default: [],
    },
    experience: {
      type: [
        {
          company: String,
          title: String,
          startDate: { type: String, default: "" },
          endDate: { type: String, default: "" },
          bullets: { type: [String], default: [] },
          evidence: evidenceSchema,
        },
      ],
      default: [],
    },
    education: {
      type: [
        {
          school: String,
          degree: String,
          field: { type: String, default: "" },
          evidence: evidenceSchema,
        },
      ],
      default: [],
    },
    projects: {
      type: [
        {
          name: String,
          description: { type: String, default: "" },
          evidence: evidenceSchema,
        },
      ],
      default: [],
    },
    achievements: {
      type: [
        {
          text: String,
          evidence: evidenceSchema,
        },
      ],
      default: [],
    },
    preferredRoles: {
      type: [String],
      default: [],
    },
    preferredLocations: {
      type: [String],
      default: [],
    },
    reviewStatus: {
      type: String,
      required: true,
      enum: ["draft", "reviewed"],
      default: "draft",
    },
  },
  {
    collection: "candidate_profiles",
    timestamps: true,
    versionKey: false,
  },
);

candidateProfileSchema.index({ userId: 1, resumeId: 1 }, { unique: true });

export type CandidateProfileLean = InferSchemaType<
  typeof candidateProfileSchema
> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type CandidateProfileModelType = Model<CandidateProfileLean>;

export const CandidateProfileModel: CandidateProfileModelType =
  (mongoose.models.CandidateProfile as CandidateProfileModelType | undefined) ??
  mongoose.model<CandidateProfileLean>(
    "CandidateProfile",
    candidateProfileSchema,
  );
