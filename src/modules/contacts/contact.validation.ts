import { z } from "zod";

export const createContactSchema = z.object({
  companyId: z.string().min(1),
  fullName: z.string().trim().min(1).max(200),
  title: z.string().trim().max(200).optional().or(z.literal("")),
  department: z.string().trim().max(120).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  linkedinUrl: z.string().trim().max(500).optional().or(z.literal("")),
  sourceType: z.string().trim().min(1).max(80).default("manual"),
  sourceUrl: z.string().trim().max(500).optional().or(z.literal("")),
  confidence: z.coerce.number().min(0).max(1).default(0.8),
  emailStatus: z
    .enum(["unknown", "inferred", "verified", "bounced"])
    .default("unknown"),
});

export const updateContactSchema = createContactSchema
  .omit({ companyId: true, sourceType: true, sourceUrl: true })
  .extend({
    contactId: z.string().min(1),
  });
