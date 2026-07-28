import { inngest, resumeEvents } from "@/inngest/client";
import { processResumeExtraction } from "@/modules/resumes/resume.service";

export const extractResumeFunction = inngest.createFunction(
  {
    id: "resume-extract-text",
    name: "Extract CV text",
    retries: 2,
    triggers: [{ event: resumeEvents.extractionRequested }],
  },
  async ({ event, step }) => {
    const { userId, resumeId } = event.data as {
      userId: string;
      resumeId: string;
    };

    await step.run("extract-cv-text", async () => {
      await processResumeExtraction({ userId, resumeId });
    });

    return { ok: true, resumeId };
  },
);

export const inngestFunctions = [extractResumeFunction];
