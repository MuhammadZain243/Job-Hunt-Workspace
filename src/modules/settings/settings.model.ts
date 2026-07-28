import "server-only";

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const cvStorageProviderValues = ["local", "cloudinary", "s3"] as const;

const appSettingsSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    timezone: {
      type: String,
      required: true,
      default: "Asia/Karachi",
    },
    locale: {
      type: String,
      required: true,
      default: "en-PK",
    },
    dailyEmailLimit: {
      type: Number,
      required: true,
      default: 10,
      min: 1,
    },
    minFollowUpHours: {
      type: Number,
      required: true,
      default: 24,
      min: 1,
    },
    cvStorageProvider: {
      type: String,
      required: true,
      enum: cvStorageProviderValues,
      default: "local",
    },
    defaultCvId: {
      type: String,
      required: false,
      default: null,
    },
    autoFollowUpsEnabled: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    collection: "app_settings",
    timestamps: true,
    versionKey: false,
  },
);

export type AppSettingsLean = InferSchemaType<typeof appSettingsSchema>;

export type AppSettingsModelType = Model<AppSettingsLean>;

export const AppSettingsModel: AppSettingsModelType =
  (mongoose.models.AppSettings as AppSettingsModelType | undefined) ??
  mongoose.model<AppSettingsLean>("AppSettings", appSettingsSchema);
