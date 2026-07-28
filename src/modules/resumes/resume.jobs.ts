import "server-only";

import { inngest, resumeEvents } from "@/inngest/client";
import { getServerEnv } from "@/lib/env/server";
import { processResumeExtraction } from "@/modules/resumes/resume.service";

export async function enqueueResumeExtraction(input: {
  userId: string;
  resumeId: string;
}) {
  const env = getServerEnv();

  if (env.INNGEST_EVENT_KEY) {
    await inngest.send({
      name: resumeEvents.extractionRequested,
      data: input,
    });
    return { mode: "async" as const };
  }

  // Local/dev fallback when Inngest is not configured yet.
  await processResumeExtraction(input);
  return { mode: "sync" as const };
}
