import { z } from "zod";

export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeDomain(input: string): string {
  const raw = input.trim().toLowerCase();
  if (!raw) return "";
  try {
    const withProtocol = raw.includes("://") ? raw : `https://${raw}`;
    const hostname = new URL(withProtocol).hostname.replace(/^www\./, "");
    return hostname;
  } catch {
    return raw.replace(/^www\./, "").split("/")[0] ?? "";
  }
}

export const createCompanySchema = z.object({
  name: z.string().trim().min(1).max(200),
  domain: z.string().trim().max(255).optional().or(z.literal("")),
  websiteUrl: z.string().trim().max(500).optional().or(z.literal("")),
  linkedinUrl: z.string().trim().max(500).optional().or(z.literal("")),
  industry: z.string().trim().max(120).optional().or(z.literal("")),
  summary: z.string().trim().max(2000).optional().or(z.literal("")),
  sourceType: z.string().trim().min(1).max(80).default("manual"),
  sourceUrl: z.string().trim().max(500).optional().or(z.literal("")),
});

export const updateCompanySchema = createCompanySchema.partial().extend({
  companyId: z.string().min(1),
});
