import { z } from "zod";

import { applicationStatusValues } from "@/modules/applications/application.transitions";

export const createApplicationSchema = z.object({
  jobId: z.string().min(1),
  resumeId: z.string().optional().or(z.literal("")),
  primaryContactId: z.string().optional().or(z.literal("")),
});

export const transitionApplicationSchema = z.object({
  applicationId: z.string().min(1),
  nextStatus: z.enum(applicationStatusValues),
  reason: z.string().trim().max(500).optional().or(z.literal("")),
});
