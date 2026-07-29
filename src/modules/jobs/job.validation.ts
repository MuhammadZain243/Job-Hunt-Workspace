import { z } from "zod";

export const importJobSchema = z.object({
  companyId: z.string().min(1),
  sourceUrl: z.string().trim().max(1000).optional().or(z.literal("")),
  pastedText: z.string().trim().min(20).max(50_000),
  applicationUrl: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const selectJobRoleSchema = z.object({
  jobId: z.string().min(1),
  roleId: z.string().min(1),
});

export const updateJobReviewSchema = z.object({
  jobId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  workplaceType: z.string().trim().max(80).optional().or(z.literal("")),
  employmentType: z.string().trim().max(80).optional().or(z.literal("")),
  applicationUrl: z.string().trim().max(1000).optional().or(z.literal("")),
});
