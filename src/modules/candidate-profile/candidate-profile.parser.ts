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

/**
 * Deterministic draft profile from extracted CV text.
 * AI structuring can refine this later; facts stay evidence-backed.
 */
export function buildDraftCandidateProfile(text: string): DraftCandidateProfile {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const emailMatch = text.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  );
  const phoneMatch = text.match(
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/,
  );
  const linkedinMatch = text.match(
    /https?:\/\/(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?/i,
  );

  const skills: DraftCandidateProfile["skills"] = [];
  const skillsIndex = lines.findIndex((line) =>
    /^skills?\b/i.test(line.replace(/[:\-–—]/g, "").trim()),
  );
  if (skillsIndex >= 0) {
    const skillBlob = lines
      .slice(skillsIndex + 1, skillsIndex + 6)
      .join(" ");
    for (const part of skillBlob.split(/[,•|]/)) {
      const name = part.trim();
      if (name.length >= 2 && name.length <= 40) {
        skills.push({
          name,
          category: "general",
          evidence: { source: "cv_text", excerpt: name },
        });
      }
    }
  }

  const headline = lines[0] ?? "";
  const summary = lines.slice(1, 4).join(" ").slice(0, 500);

  return {
    headline,
    summary,
    contact: {
      email: emailMatch?.[0] ?? "",
      phone: phoneMatch?.[0] ?? "",
      location: "",
      linkedinUrl: linkedinMatch?.[0] ?? "",
    },
    skills: skills.slice(0, 30),
    experience: [],
    education: [],
    projects: [],
    achievements: [],
  };
}
