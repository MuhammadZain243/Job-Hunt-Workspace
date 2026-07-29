export const applicationStatusValues = [
  "discovered",
  "reviewing",
  "ready_to_apply",
  "applied",
  "outreach_active",
  "hr_contacted",
  "screening",
  "interviewing",
  "assessment",
  "offer",
  "rejected",
  "withdrawn",
  "closed",
] as const;

export type ApplicationStatus = (typeof applicationStatusValues)[number];

const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  discovered: ["reviewing", "ready_to_apply", "withdrawn", "closed"],
  reviewing: ["ready_to_apply", "applied", "withdrawn", "closed"],
  ready_to_apply: ["applied", "outreach_active", "withdrawn", "closed"],
  applied: [
    "outreach_active",
    "hr_contacted",
    "screening",
    "interviewing",
    "rejected",
    "withdrawn",
    "closed",
  ],
  outreach_active: [
    "hr_contacted",
    "screening",
    "interviewing",
    "rejected",
    "withdrawn",
    "closed",
  ],
  hr_contacted: [
    "screening",
    "interviewing",
    "assessment",
    "offer",
    "rejected",
    "withdrawn",
    "closed",
  ],
  screening: [
    "interviewing",
    "assessment",
    "offer",
    "rejected",
    "withdrawn",
    "closed",
  ],
  interviewing: ["assessment", "offer", "rejected", "withdrawn", "closed"],
  assessment: ["offer", "rejected", "withdrawn", "closed"],
  offer: ["closed", "withdrawn", "rejected"],
  rejected: ["closed"],
  withdrawn: ["closed"],
  closed: [],
};

export function canTransitionApplication(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  if (from === to) return false;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextActionForStatus(status: ApplicationStatus): string {
  switch (status) {
    case "discovered":
      return "Review the job and select a target role";
    case "reviewing":
      return "Confirm facts and mark ready to apply";
    case "ready_to_apply":
      return "Prepare outreach or submit the application";
    case "applied":
      return "Track reply and schedule follow-up if needed";
    case "outreach_active":
      return "Monitor sequence and replies";
    case "hr_contacted":
      return "Prepare for screening or interview";
    case "screening":
    case "interviewing":
    case "assessment":
      return "Complete next interview step";
    case "offer":
      return "Review offer details";
    case "rejected":
    case "withdrawn":
    case "closed":
      return "No action required";
    default:
      return "Review application";
  }
}
