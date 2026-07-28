import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "job-hunt-workspace",
  name: "Job Hunt Workspace",
});

export const resumeEvents = {
  extractionRequested: "resume/extraction.requested",
} as const;
