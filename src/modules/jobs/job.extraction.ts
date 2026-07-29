import { createHash } from "node:crypto";

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
  /system\s*:\s*/gi,
  /you\s+are\s+(now\s+)?(?:an?\s+)?(?:ai|assistant|chatgpt)/gi,
  /<\/?script[^>]*>/gi,
  /\[\s*INST\s*\]/gi,
];

export type ExtractedRoleOption = {
  id: string;
  title: string;
  selected: boolean;
};

export type ExtractedJobDraft = {
  title: string;
  description: string;
  roleOptions: ExtractedRoleOption[];
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  location: string;
  workplaceType: string;
  employmentType: string;
  warnings: string[];
};

function roleId(title: string, index: number) {
  const hash = createHash("sha256")
    .update(`${index}:${title}`)
    .digest("hex")
    .slice(0, 12);
  return `role_${hash}`;
}

export function sanitizeJobSourceText(raw: string): {
  text: string;
  strippedInjection: boolean;
} {
  let text = raw.replace(/\u0000/g, "");
  let strippedInjection = false;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      strippedInjection = true;
      text = text.replace(pattern, " ");
    }
  }

  text = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text, strippedInjection };
}

function sectionLines(text: string, heading: RegExp): string[] {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) =>
    heading.test(line.replace(/[:\-–—]/g, " ").trim()),
  );
  if (start < 0) return [];

  const collected: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^[A-Z][A-Za-z\s]{2,40}$/.test(line.trim()) && /:$/.test(line)) {
      break;
    }
    if (
      /^(requirements?|responsibilities|skills?|about the (role|job)|qualifications)\b/i.test(
        line.trim(),
      )
    ) {
      break;
    }
    if (line.trim()) {
      collected.push(line.replace(/^[•\-–—*·]\s+/, "").trim());
    }
  }
  return collected;
}

/**
 * Deterministic job draft extraction from manual pasted text.
 * Never invents facts; role options must be selected explicitly by the owner.
 */
export function extractJobDraftFromText(raw: string): ExtractedJobDraft {
  const { text, strippedInjection } = sanitizeJobSourceText(raw);
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const warnings: string[] = [];
  if (strippedInjection) {
    warnings.push(
      "Potential prompt-injection phrases were removed from the source text.",
    );
  }

  const titleLine =
    lines
      .find((line) => /^title\s*[:\-]/i.test(line))
      ?.replace(/^title\s*[:\-]\s*/i, "") ??
    lines[0] ??
    "Untitled role";

  const roleSection = sectionLines(
    text,
    /^(roles?|open positions|positions)\b/i,
  );
  const roleTitles =
    roleSection.length > 0 ? roleSection : [titleLine].filter(Boolean);

  const uniqueTitles = Array.from(
    new Set(roleTitles.map((title) => title.trim()).filter(Boolean)),
  ).slice(0, 12);

  const roleOptions = uniqueTitles.map((title, index) => ({
    id: roleId(title, index),
    title,
    selected: uniqueTitles.length === 1,
  }));

  if (roleOptions.length > 1) {
    warnings.push(
      "Multiple role options were detected. Select one target role before creating an application.",
    );
  }

  const requirements = sectionLines(text, /^requirements?\b/i).slice(0, 40);
  const responsibilities = sectionLines(
    text,
    /^(responsibilities|what you.?ll do)\b/i,
  ).slice(0, 40);
  const skills = sectionLines(text, /^skills?\b/i)
    .join(" ")
    .split(/[,•|]/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2 && part.length <= 60)
    .slice(0, 40);

  const locationMatch = text.match(/(?:location|based in)\s*[:\-]\s*([^\n]+)/i);
  const workplaceMatch = text.match(/\b(remote|hybrid|on[-\s]?site|onsite)\b/i);
  const employmentMatch = text.match(
    /\b(full[-\s]?time|part[-\s]?time|contract|internship)\b/i,
  );

  return {
    title: titleLine.slice(0, 200),
    description: text.slice(0, 20_000),
    roleOptions,
    requirements,
    responsibilities,
    skills,
    location: locationMatch?.[1]?.trim().slice(0, 200) ?? "",
    workplaceType: workplaceMatch?.[1]?.toLowerCase() ?? "",
    employmentType: employmentMatch?.[1]?.toLowerCase() ?? "",
    warnings,
  };
}
