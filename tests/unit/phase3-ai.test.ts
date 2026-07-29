import { describe, expect, it } from "vitest";

import {
  buildGroundingPacket,
  validateGenerationAgainstPacket,
} from "@/modules/ai/ai.grounding";
import {
  jobMatchOutputSchema,
  linkedInDraftOutputSchema,
  outreachEmailOutputSchema,
} from "@/modules/ai/ai.schemas";
import { openaiCredentialsSchema } from "@/providers/ai/openai/openai.validation";
import { PROMPT_VERSIONS } from "@/prompts/outreach";

describe("openai credentials", () => {
  it("accepts sk- keys", () => {
    expect(
      openaiCredentialsSchema.parse({
        apiKey: "sk-abcdefghijklmnopqrstuvwxyz",
      }).apiKey,
    ).toMatch(/^sk-/);
  });

  it("rejects non sk keys", () => {
    expect(() =>
      openaiCredentialsSchema.parse({ apiKey: "not-a-real-key-value" }),
    ).toThrow();
  });
});

describe("grounding packet", () => {
  it("builds reviewed facts with ids", () => {
    const packet = buildGroundingPacket({
      profile: {
        reviewStatus: "reviewed",
        headline: "Engineer",
        summary: "Builds products",
        skills: [{ name: "TypeScript", evidence: { excerpt: "TypeScript" } }],
        experience: [
          {
            title: "Engineer",
            company: "Acme",
            bullets: ["Shipped APIs"],
          },
        ],
      },
      job: {
        id: "job1",
        title: "Backend Engineer",
        selectedRoleTitle: "Backend Engineer",
        location: "Remote",
        requirements: ["TypeScript"],
        responsibilities: ["Build APIs"],
        skills: ["TypeScript"],
      },
      company: {
        id: "co1",
        name: "Acme",
        domain: "acme.com",
        industry: "Software",
        summary: "Product company",
      },
    });

    expect(packet.candidate.reviewedFacts.length).toBeGreaterThan(0);
    expect(packet.job.selectedRole).toBe("Backend Engineer");
  });

  it("flags first-person claims without factsUsed", () => {
    const packet = buildGroundingPacket({
      profile: {
        reviewStatus: "reviewed",
        headline: "Engineer",
        summary: "Builds products",
      },
      job: {
        id: "job1",
        title: "Backend Engineer",
        selectedRoleTitle: "Backend Engineer",
        location: "",
        requirements: [],
        responsibilities: [],
        skills: [],
      },
      company: {
        id: "co1",
        name: "Acme",
        domain: "",
        industry: "",
        summary: "",
      },
    });

    const warnings = validateGenerationAgainstPacket({
      packet,
      factsUsed: [],
      firstPersonText: "I built distributed systems at scale.",
    });

    expect(warnings.some((warning) => /First-person/i.test(warning))).toBe(
      true,
    );
  });
});

describe("ai output schemas", () => {
  it("validates outreach email output", () => {
    const parsed = outreachEmailOutputSchema.parse({
      subject: "Application for Backend Engineer",
      plainText: "Hello, I am writing about the Backend Engineer role.",
      html: "",
      coverLetterPlainText: "Cover letter body with evidence-backed claims.",
      factsUsed: [
        {
          outputFragment: "Backend Engineer role",
          sourceFactIds: ["fact_1"],
        },
      ],
      warnings: [],
      missingInformation: [],
    });
    expect(parsed.subject.length).toBeGreaterThan(0);
  });

  it("validates linkedin and job match schemas", () => {
    expect(
      linkedInDraftOutputSchema.parse({
        connectionNote: "Hi, I'd like to connect about the Backend role.",
        message: "I noticed the Backend Engineer opening at Acme.",
        factsUsed: [{ outputFragment: "Backend", sourceFactIds: ["fact_1"] }],
        warnings: [],
        missingInformation: [],
      }).connectionNote.length,
    ).toBeLessThanOrEqual(280);

    expect(
      jobMatchOutputSchema.parse({
        matched: [
          {
            requirement: "TypeScript",
            evidence: "Used TypeScript at Acme",
            sourceFactIds: ["fact_1"],
          },
        ],
        partial: [],
        missing: [],
        strongestEvidence: ["Used TypeScript at Acme"],
        ownerQuestions: ["Is remote OK?"],
        descriptiveFitNote: "Strong overlap on core stack.",
        warnings: [],
      }).matched,
    ).toHaveLength(1);
  });

  it("exposes prompt versions", () => {
    expect(PROMPT_VERSIONS.outreachEmail).toBe("outreach-email.v1");
  });
});
