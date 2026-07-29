import "server-only";

export type DraftCandidateProfile = {
  headline: string;
  summary: string;
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedinUrl: string;
  };
  skills: Array<{
    name: string;
    category: string;
    evidence: { source: "cv_text"; excerpt: string };
  }>;
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    bullets: string[];
    evidence: { source: "cv_text"; excerpt: string };
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    evidence: { source: "cv_text"; excerpt: string };
  }>;
  projects: Array<{
    name: string;
    description: string;
    evidence: { source: "cv_text"; excerpt: string };
  }>;
  achievements: Array<{
    text: string;
    evidence: { source: "cv_text"; excerpt: string };
  }>;
};

const SECTION_ALIASES: Record<
  | "skills"
  | "experience"
  | "education"
  | "projects"
  | "achievements"
  | "summary",
  RegExp
> = {
  skills: /^(skills?|technical skills|core competencies)\b/i,
  experience:
    /^(experience|work experience|professional experience|employment)\b/i,
  education: /^(education|academic background|academics)\b/i,
  projects: /^(projects?|selected projects|personal projects)\b/i,
  achievements: /^(achievements?|awards?|honors?|accomplishments?)\b/i,
  summary: /^(summary|profile|about|objective|professional summary)\b/i,
};

function normalizeHeading(line: string) {
  return line.replace(/[:\-–—|•]/g, " ").trim();
}

function detectSection(line: string): keyof typeof SECTION_ALIASES | null {
  const heading = normalizeHeading(line);
  for (const [key, pattern] of Object.entries(SECTION_ALIASES) as Array<
    [keyof typeof SECTION_ALIASES, RegExp]
  >) {
    if (pattern.test(heading) && heading.length <= 48) {
      return key;
    }
  }
  return null;
}

function splitSections(lines: string[]) {
  const buckets: Record<keyof typeof SECTION_ALIASES | "preamble", string[]> = {
    preamble: [],
    skills: [],
    experience: [],
    education: [],
    projects: [],
    achievements: [],
    summary: [],
  };

  let current: keyof typeof buckets = "preamble";
  for (const line of lines) {
    const section = detectSection(line);
    if (section) {
      current = section;
      continue;
    }
    buckets[current].push(line);
  }

  return buckets;
}

function parseSkills(lines: string[]): DraftCandidateProfile["skills"] {
  const skills: DraftCandidateProfile["skills"] = [];
  const blob = lines.join(" ");
  for (const part of blob.split(/[,•|·;/]/)) {
    const name = part.trim();
    if (name.length >= 2 && name.length <= 40 && !detectSection(name)) {
      skills.push({
        name,
        category: "general",
        evidence: { source: "cv_text", excerpt: name },
      });
    }
  }
  return skills.slice(0, 30);
}

function parseExperience(lines: string[]): DraftCandidateProfile["experience"] {
  const items: DraftCandidateProfile["experience"] = [];
  let current: DraftCandidateProfile["experience"][number] | null = null;

  const dateRange =
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–—]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|Present|Current|Now)/i;

  for (const line of lines) {
    if (/^[•\-–—*]\s+/.test(line) || /^·\s+/.test(line)) {
      const bullet = line.replace(/^[•\-–—*·]\s+/, "").trim();
      if (current && bullet) {
        current.bullets.push(bullet);
      }
      continue;
    }

    const dates = line.match(dateRange);
    const withoutDates = dates
      ? line.replace(dates[0], "").replace(/[|•]/g, " ").trim()
      : line;
    const parts = withoutDates
      .split(/\s+[|@–—-]\s+|\s{2,}/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length >= 2 || dates) {
      if (current) {
        items.push(current);
      }
      current = {
        title: parts[0] ?? line,
        company: parts[1] ?? parts[0] ?? "",
        startDate: dates?.[1] ?? "",
        endDate: dates?.[2] ?? "",
        bullets: [],
        evidence: { source: "cv_text", excerpt: line.slice(0, 180) },
      };
      continue;
    }

    if (current && line.length > 12) {
      current.bullets.push(line);
    }
  }

  if (current) {
    items.push(current);
  }

  return items.slice(0, 12);
}

function parseEducation(lines: string[]): DraftCandidateProfile["education"] {
  const items: DraftCandidateProfile["education"] = [];
  for (const line of lines.slice(0, 12)) {
    if (!line || line.length < 4) continue;
    const parts = line
      .split(/\s+[|–—-]\s+|\s{2,}/)
      .map((part) => part.trim())
      .filter(Boolean);
    items.push({
      school: parts[0] ?? line,
      degree: parts[1] ?? "",
      field: parts[2] ?? "",
      evidence: { source: "cv_text", excerpt: line.slice(0, 180) },
    });
  }
  return items.slice(0, 8);
}

function parseProjects(lines: string[]): DraftCandidateProfile["projects"] {
  const items: DraftCandidateProfile["projects"] = [];
  let current: DraftCandidateProfile["projects"][number] | null = null;

  for (const line of lines) {
    if (/^[•\-–—*·]\s+/.test(line)) {
      const detail = line.replace(/^[•\-–—*·]\s+/, "").trim();
      if (current && detail) {
        current.description = [current.description, detail]
          .filter(Boolean)
          .join(" ");
      }
      continue;
    }

    if (current) {
      items.push(current);
    }
    current = {
      name: line.slice(0, 120),
      description: "",
      evidence: { source: "cv_text", excerpt: line.slice(0, 180) },
    };
  }

  if (current) {
    items.push(current);
  }

  return items.slice(0, 8);
}

function parseAchievements(
  lines: string[],
): DraftCandidateProfile["achievements"] {
  return lines
    .map((line) => line.replace(/^[•\-–—*·]\s+/, "").trim())
    .filter((line) => line.length >= 4)
    .slice(0, 12)
    .map((text) => ({
      text,
      evidence: { source: "cv_text" as const, excerpt: text.slice(0, 180) },
    }));
}

/**
 * Deterministic draft profile from extracted CV text.
 * AI structuring can refine this later; facts stay evidence-backed.
 */
export function buildDraftCandidateProfile(
  text: string,
): DraftCandidateProfile {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const sections = splitSections(lines);

  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = text.match(
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/,
  );
  const linkedinMatch = text.match(
    /https?:\/\/(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?/i,
  );
  const locationMatch = text.match(
    /\b([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*),\s*([A-Z]{2}|[A-Z][a-zA-Z]+)\b/,
  );

  const headline = sections.preamble[0] ?? lines[0] ?? "";
  const summaryFromSection = sections.summary.join(" ").slice(0, 500);
  const summary =
    summaryFromSection || sections.preamble.slice(1, 4).join(" ").slice(0, 500);

  return {
    headline,
    summary,
    contact: {
      email: emailMatch?.[0] ?? "",
      phone: phoneMatch?.[0] ?? "",
      location: locationMatch?.[0] ?? "",
      linkedinUrl: linkedinMatch?.[0] ?? "",
    },
    skills: parseSkills(sections.skills),
    experience: parseExperience(sections.experience),
    education: parseEducation(sections.education),
    projects: parseProjects(sections.projects),
    achievements: parseAchievements(sections.achievements),
  };
}
