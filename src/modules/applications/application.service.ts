import "server-only";

import { connectMongoose } from "@/lib/db/mongoose";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors/app-error";
import {
  type ApplicationStatus,
  canTransitionApplication,
  nextActionForStatus,
} from "@/modules/applications/application.transitions";
import { ApplicationModel } from "@/modules/applications/application.model";
import {
  createApplicationSchema,
  transitionApplicationSchema,
} from "@/modules/applications/application.validation";
import { recordAuditEvent } from "@/modules/audit/audit.service";
import { getJob, requireSelectedTargetRole } from "@/modules/jobs/job.service";

function mapApplication(doc: {
  _id: { toString(): string };
  jobId: string;
  companyId: string;
  targetRole: string;
  resumeId?: string | null;
  primaryContactId?: string | null;
  status: string;
  statusHistory?: Array<{
    from: string;
    to: string;
    at: Date;
    reason?: string | null;
    actor: string;
  }>;
  appliedAt?: Date | null;
  hrContactedAt?: Date | null;
  nextAction?: string | null;
  nextActionAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: doc._id.toString(),
    jobId: doc.jobId,
    companyId: doc.companyId,
    targetRole: doc.targetRole,
    resumeId: doc.resumeId ?? null,
    primaryContactId: doc.primaryContactId ?? null,
    status: doc.status as ApplicationStatus,
    statusHistory: doc.statusHistory ?? [],
    appliedAt: doc.appliedAt ?? null,
    hrContactedAt: doc.hrContactedAt ?? null,
    nextAction: doc.nextAction ?? "",
    nextActionAt: doc.nextActionAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function listApplications(userId: string) {
  await connectMongoose();
  const docs = await ApplicationModel.find({ userId })
    .sort({ updatedAt: -1 })
    .lean();
  return docs.map(mapApplication);
}

export async function getApplication(userId: string, applicationId: string) {
  await connectMongoose();
  const doc = await ApplicationModel.findOne({
    _id: applicationId,
    userId,
  }).lean();
  if (!doc) {
    throw new NotFoundError("Application not found");
  }
  return mapApplication(doc);
}

export async function createApplication(userId: string, input: unknown) {
  await connectMongoose();
  const parsed = createApplicationSchema.parse(input);
  const job = await getJob(userId, parsed.jobId);
  const targetRole = await requireSelectedTargetRole(userId, parsed.jobId);

  const existing = await ApplicationModel.findOne({
    userId,
    jobId: parsed.jobId,
    targetRole,
  }).lean();

  if (existing) {
    throw new ConflictError(
      "An application already exists for this job and target role",
    );
  }

  const initialStatus: ApplicationStatus = "discovered";
  const doc = await ApplicationModel.create({
    userId,
    jobId: parsed.jobId,
    companyId: job.companyId,
    targetRole,
    resumeId: parsed.resumeId || null,
    primaryContactId: parsed.primaryContactId || null,
    status: initialStatus,
    statusHistory: [
      {
        from: initialStatus,
        to: initialStatus,
        at: new Date(),
        reason: "created",
        actor: "owner",
      },
    ],
    nextAction: nextActionForStatus(initialStatus),
  });

  await recordAuditEvent({
    userId,
    action: "application.created",
    entityType: "application",
    entityId: doc._id.toString(),
    metadata: { jobId: parsed.jobId, targetRole },
  });

  return mapApplication(doc.toObject());
}

export async function transitionApplication(userId: string, input: unknown) {
  await connectMongoose();
  const parsed = transitionApplicationSchema.parse(input);

  const existing = await ApplicationModel.findOne({
    _id: parsed.applicationId,
    userId,
  }).lean();

  if (!existing) {
    throw new NotFoundError("Application not found");
  }

  const from = existing.status as ApplicationStatus;
  const to = parsed.nextStatus;

  if (!canTransitionApplication(from, to)) {
    throw new ValidationError(
      `Cannot transition application from ${from} to ${to}`,
    );
  }

  const now = new Date();
  const doc = await ApplicationModel.findOneAndUpdate(
    { _id: parsed.applicationId, userId, status: from },
    {
      $set: {
        status: to,
        nextAction: nextActionForStatus(to),
        appliedAt:
          to === "applied" ? (existing.appliedAt ?? now) : existing.appliedAt,
        hrContactedAt:
          to === "hr_contacted"
            ? (existing.hrContactedAt ?? now)
            : existing.hrContactedAt,
      },
      $inc: { version: 1 },
      $push: {
        statusHistory: {
          from,
          to,
          at: now,
          reason: parsed.reason?.trim() ?? "",
          actor: "owner",
        },
      },
    },
    { returnDocument: "after" },
  ).lean();

  if (!doc) {
    throw new ConflictError("Application status changed. Refresh and retry.");
  }

  await recordAuditEvent({
    userId,
    action: "application.status_changed",
    entityType: "application",
    entityId: parsed.applicationId,
    metadata: { from, to },
  });

  return mapApplication(doc);
}

export async function getApplicationDashboardSummary(userId: string) {
  await connectMongoose();
  const [total, byStatus, upcoming] = await Promise.all([
    ApplicationModel.countDocuments({ userId }),
    ApplicationModel.aggregate<{ _id: string; count: number }>([
      { $match: { userId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    ApplicationModel.find({
      userId,
      status: {
        $nin: ["rejected", "withdrawn", "closed", "offer"],
      },
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
  ]);

  return {
    total,
    byStatus: Object.fromEntries(
      byStatus.map((row) => [row._id, row.count]),
    ) as Record<string, number>,
    recentActive: upcoming.map(mapApplication),
  };
}

export async function countApplications(userId: string) {
  await connectMongoose();
  return ApplicationModel.countDocuments({ userId });
}
