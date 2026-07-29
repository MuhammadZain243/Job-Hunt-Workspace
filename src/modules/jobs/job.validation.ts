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
  requirementsText: z.string().trim().max(20_000).optional().or(z.literal("")),
  responsibilitiesText: z
    .string()
    .trim()
    .max(20_000)
    .optional()
    .or(z.literal("")),
  skillsText: z.string().trim().max(5_000).optional().or(z.literal("")),
});

export function linesFromTextarea(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^[•\-–—*·]\s+/, "").trim())
    .filter(Boolean)
    .slice(0, 60);
}

export function csvFromTextarea(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/[,•|;\n]/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2 && part.length <= 80)
    .slice(0, 60);
}
