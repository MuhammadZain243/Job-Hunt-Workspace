import "server-only";

import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const auditEventSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
    },
    entityId: {
      type: String,
      required: false,
    },
    correlationId: {
      type: String,
      required: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    createdAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
  },
  {
    collection: "audit_events",
    timestamps: false,
    versionKey: false,
  },
);

auditEventSchema.index({ userId: 1, createdAt: -1 });
auditEventSchema.index({ action: 1, createdAt: -1 });

export type AuditEventLean = InferSchemaType<typeof auditEventSchema>;

export type AuditEventModel = Model<AuditEventLean>;

export const AuditEventModel: AuditEventModel =
  (mongoose.models.AuditEvent as AuditEventModel | undefined) ??
  mongoose.model<AuditEventLean>("AuditEvent", auditEventSchema);
