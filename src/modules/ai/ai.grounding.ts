import "server-only";

export type GroundingFact = {
  id: string;
  kind: string;
  text: string;
  evidence?: string;
};

export type GroundingPacket = {
  candidate: {
    reviewStatus: "draft" | "reviewed";
    headline: string;
    summary: string;
    preferredRoles: string[];
    reviewedFacts: GroundingFact[];
  };
  job: {
    id: string;
    title: string;
    selectedRole: string;
    location: string;
    requirements: string[];
    responsibilities: string[];
    skills: string[];
  };
  company: {
    id: string;
    name: string;
    domain: string;
    industry: string;
    summary: string;
  };
  contact: {
    id?: string;
    name?: string;
    title?: string;
    email?: string;
  };
  constraints: {
    maxSubjectCharacters: number;
    maxEmailWords: number;
    prohibitedClaims: string[];
  };
};

export function buildGroundingPacket(input: {
  profile: {
    reviewStatus: "draft" | "reviewed";
    headline: string;
    summary: string;
    preferredRoles?: string[];
    skills?: Array<{ name: string; evidence?: { excerpt?: string } }>;
    experience?: Array<{
      title: string;
      company: string;
      bullets?: string[];
      evidence?: { excerpt?: string };
    }>;
    achievements?: Array<{ text: string; evidence?: { excerpt?: string } }>;
  };
  job: {
    id: string;
    title: string;
    selectedRoleTitle: string | null;
    location: string;
    requirements: string[];
    responsibilities: string[];
    skills: string[];
  };
  company: {
    id: string;
    name: string;
    domain: string;
    industry: string;
    summary: string;
  };
  contact?: {
    id: string;
    fullName: string;
    title: string;
    email: string;
  } | null;
}): GroundingPacket {
  const facts: GroundingFact[] = [];
  let index = 1;

  const push = (kind: string, text: string, evidence?: string) => {
    if (!text.trim()) return;
    facts.push({
      id: `fact_${index++}`,
      kind,
      text: text.trim(),
      evidence: evidence?.trim() || undefined,
    });
  };

  push("headline", input.profile.headline);
  push("summary", input.profile.summary);

  for (const skill of input.profile.skills ?? []) {
    push("skill", skill.name, skill.evidence?.excerpt);
  }
  for (const item of input.profile.experience ?? []) {
    push(
      "experience",
      `${item.title} at ${item.company}`,
      item.evidence?.excerpt ?? item.bullets?.slice(0, 2).join("; "),
    );
  }
  for (const item of input.profile.achievements ?? []) {
    push("achievement", item.text, item.evidence?.excerpt);
  }

  return {
    candidate: {
      reviewStatus: input.profile.reviewStatus,
      headline: input.profile.headline,
      summary: input.profile.summary,
      preferredRoles: input.profile.preferredRoles ?? [],
      reviewedFacts: facts,
    },
    job: {
      id: input.job.id,
      title: input.job.title,
      selectedRole: input.job.selectedRoleTitle ?? "",
      location: input.job.location,
      requirements: input.job.requirements,
      responsibilities: input.job.responsibilities,
      skills: input.job.skills,
    },
    company: {
      id: input.company.id,
      name: input.company.name,
      domain: input.company.domain,
      industry: input.company.industry,
      summary: input.company.summary,
    },
    contact: input.contact
      ? {
          id: input.contact.id,
          name: input.contact.fullName,
          title: input.contact.title,
          email: input.contact.email,
        }
      : {},
    constraints: {
      maxSubjectCharacters: 90,
      maxEmailWords: 220,
      prohibitedClaims: [
        "invented metrics",
        "unverified technologies",
        "hiring probability",
        "fabricated contacts",
      ],
    },
  };
}

export function validateGenerationAgainstPacket(input: {
  packet: GroundingPacket;
  factsUsed: Array<{ outputFragment: string; sourceFactIds: string[] }>;
  firstPersonText: string;
}): string[] {
  const warnings: string[] = [];
  const knownIds = new Set(
    input.packet.candidate.reviewedFacts.map((fact) => fact.id),
  );

  for (const used of input.factsUsed) {
    for (const id of used.sourceFactIds) {
      if (!knownIds.has(id)) {
        warnings.push(`Unknown source fact id referenced: ${id}`);
      }
    }
  }

  const firstPersonClaims =
    input.firstPersonText.match(/\bI\b[^.!?\n]{8,120}/g) ?? [];
  if (firstPersonClaims.length > 0 && input.factsUsed.length === 0) {
    warnings.push(
      "First-person claims were generated without mapped source facts.",
    );
  }

  if (!input.packet.job.selectedRole) {
    warnings.push("Selected target role is missing.");
  }

  if (input.packet.candidate.reviewStatus !== "reviewed") {
    warnings.push("Candidate profile is not marked reviewed.");
  }

  return warnings;
}
