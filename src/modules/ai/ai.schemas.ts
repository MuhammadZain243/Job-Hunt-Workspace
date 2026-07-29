import { z } from "zod";

export const jobMatchOutputSchema = z.object({
  matched: z.array(
    z.object({
      requirement: z.string().min(1).max(300),
      evidence: z.string().min(1).max(500),
      sourceFactIds: z.array(z.string()).default([]),
    }),
  ),
  partial: z.array(
    z.object({
      requirement: z.string().min(1).max(300),
      evidence: z.string().min(1).max(500),
      gap: z.string().min(1).max(300),
      sourceFactIds: z.array(z.string()).default([]),
    }),
  ),
  missing: z.array(
    z.object({
      requirement: z.string().min(1).max(300),
      note: z.string().min(1).max(300),
    }),
  ),
  strongestEvidence: z.array(z.string().min(1).max(400)).max(8),
  ownerQuestions: z.array(z.string().min(1).max(300)).max(8),
  descriptiveFitNote: z.string().max(500).optional().default(""),
  warnings: z.array(z.string()).default([]),
});

export const outreachEmailOutputSchema = z.object({
  subject: z.string().trim().min(1).max(90),
  plainText: z.string().trim().min(1).max(4000),
  html: z.string().max(8000).optional().default(""),
  coverLetterPlainText: z.string().trim().min(1).max(8000),
  factsUsed: z
    .array(
      z.object({
        outputFragment: z.string().min(1).max(400),
        sourceFactIds: z.array(z.string()).min(1),
      }),
    )
    .default([]),
  warnings: z.array(z.string()).default([]),
  missingInformation: z.array(z.string()).default([]),
});

export const linkedInDraftOutputSchema = z.object({
  connectionNote: z.string().trim().min(1).max(280),
  message: z.string().trim().min(1).max(900),
  factsUsed: z
    .array(
      z.object({
        outputFragment: z.string().min(1).max(400),
        sourceFactIds: z.array(z.string()).min(1),
      }),
    )
    .default([]),
  warnings: z.array(z.string()).default([]),
  missingInformation: z.array(z.string()).default([]),
});

export type JobMatchOutput = z.infer<typeof jobMatchOutputSchema>;
export type OutreachEmailOutput = z.infer<typeof outreachEmailOutputSchema>;
export type LinkedInDraftOutput = z.infer<typeof linkedInDraftOutputSchema>;

export const jobMatchJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "matched",
    "partial",
    "missing",
    "strongestEvidence",
    "ownerQuestions",
    "descriptiveFitNote",
    "warnings",
  ],
  properties: {
    matched: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["requirement", "evidence", "sourceFactIds"],
        properties: {
          requirement: { type: "string" },
          evidence: { type: "string" },
          sourceFactIds: { type: "array", items: { type: "string" } },
        },
      },
    },
    partial: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["requirement", "evidence", "gap", "sourceFactIds"],
        properties: {
          requirement: { type: "string" },
          evidence: { type: "string" },
          gap: { type: "string" },
          sourceFactIds: { type: "array", items: { type: "string" } },
        },
      },
    },
    missing: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["requirement", "note"],
        properties: {
          requirement: { type: "string" },
          note: { type: "string" },
        },
      },
    },
    strongestEvidence: { type: "array", items: { type: "string" } },
    ownerQuestions: { type: "array", items: { type: "string" } },
    descriptiveFitNote: { type: "string" },
    warnings: { type: "array", items: { type: "string" } },
  },
} as const;

export const outreachEmailJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "subject",
    "plainText",
    "html",
    "coverLetterPlainText",
    "factsUsed",
    "warnings",
    "missingInformation",
  ],
  properties: {
    subject: { type: "string" },
    plainText: { type: "string" },
    html: { type: "string" },
    coverLetterPlainText: { type: "string" },
    factsUsed: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["outputFragment", "sourceFactIds"],
        properties: {
          outputFragment: { type: "string" },
          sourceFactIds: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
          },
        },
      },
    },
    warnings: { type: "array", items: { type: "string" } },
    missingInformation: { type: "array", items: { type: "string" } },
  },
} as const;

export const linkedInDraftJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "connectionNote",
    "message",
    "factsUsed",
    "warnings",
    "missingInformation",
  ],
  properties: {
    connectionNote: { type: "string" },
    message: { type: "string" },
    factsUsed: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["outputFragment", "sourceFactIds"],
        properties: {
          outputFragment: { type: "string" },
          sourceFactIds: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
          },
        },
      },
    },
    warnings: { type: "array", items: { type: "string" } },
    missingInformation: { type: "array", items: { type: "string" } },
  },
} as const;
