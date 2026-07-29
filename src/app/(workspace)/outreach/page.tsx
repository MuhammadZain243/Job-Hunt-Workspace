import type { Metadata } from "next";
import Link from "next/link";

import {
  acceptLinkedInDraftAction,
  acceptOutreachEmailAction,
  generateJobMatchAction,
  generateLinkedInDraftAction,
  generateOutreachEmailAction,
} from "@/app/(workspace)/outreach/actions";
import { CopyTextButton } from "@/components/forms/copy-text-button";
import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
import { RequiredLabel } from "@/components/forms/required-label";
import { FadeIn } from "@/components/motion/fade-in";
import { SettingsFeedbackToast } from "@/components/settings/settings-feedback-toast";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireSessionOrRedirect } from "@/lib/auth/session";
import {
  getOpenAiConnectionView,
  listGenerationsForApplication,
} from "@/modules/ai/ai-generation.service";
import type {
  JobMatchOutput,
  LinkedInDraftOutput,
  OutreachEmailOutput,
} from "@/modules/ai/ai.schemas";
import { listApplications } from "@/modules/applications/application.service";
import { listCompanies } from "@/modules/companies/company.service";
import { listJobs } from "@/modules/jobs/job.service";

export const metadata: Metadata = {
  title: "Outreach",
};

function getFeedback(
  searchParams?: Promise<Record<string, string | string[] | undefined>>,
) {
  return Promise.resolve(searchParams).then((params) => {
    const value = (key: string) => {
      const raw = params?.[key];
      return Array.isArray(raw) ? raw[0] : raw;
    };
    const success = value("success");
    const error = value("error");
    const detail = value("detail");
    const applicationId = value("applicationId") ?? "";

    const successMessages: Record<string, string> = {
      "job-match": "Job-match analysis generated.",
      "email-draft": "Email and cover letter draft generated.",
      "linkedin-draft": "LinkedIn draft generated for manual sending.",
      accepted: "Draft accepted and saved.",
    };

    return {
      applicationId,
      success: success ? (successMessages[success] ?? "Done.") : undefined,
      error: error
        ? (detail ??
          (error === "provider_auth_error"
            ? "Connect OpenAI in Settings first."
            : error === "validation_error"
              ? "Generation blocked until the application, role, CV, and reviewed profile are ready."
              : "Could not generate or save the draft."))
        : undefined,
    };
  });
}

export default async function OutreachPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireSessionOrRedirect();
  const [applications, companies, jobs, openai, feedback] = await Promise.all([
    listApplications(user.id),
    listCompanies(user.id),
    listJobs(user.id),
    getOpenAiConnectionView(user.id),
    getFeedback(searchParams),
  ]);

  const selectedId = feedback.applicationId || applications[0]?.id || "";
  const selected = applications.find((item) => item.id === selectedId) ?? null;
  const generations = selected
    ? await listGenerationsForApplication(user.id, selected.id)
    : [];

  const companyName = new Map(companies.map((c) => [c.id, c.name]));
  const jobTitle = new Map(jobs.map((j) => [j.id, j.title]));

  const latestMatch = generations.find((item) => item.purpose === "job_match");
  const latestEmail = generations.find(
    (item) => item.purpose === "outreach_email",
  );
  const latestLinkedIn = generations.find(
    (item) => item.purpose === "linkedin_draft",
  );

  const matchOutput = latestMatch?.output as JobMatchOutput | undefined;
  const emailOutput = latestEmail?.output as OutreachEmailOutput | undefined;
  const linkedInOutput = latestLinkedIn?.output as
    LinkedInDraftOutput | undefined;

  return (
    <FadeIn className="space-y-6">
      <SettingsFeedbackToast
        success={feedback.success}
        error={feedback.error}
        clearPath={
          selectedId ? `/outreach?applicationId=${selectedId}` : "/outreach"
        }
      />

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Outreach</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
          Generate grounded job-match analysis, email drafts, and LinkedIn copy
          from reviewed CV facts. AI output is a draft until you accept it.
        </p>
      </div>

      {!openai || openai.status !== "connected" ? (
        <div className="border-border/80 bg-muted/25 text-muted-foreground rounded-2xl border p-4 text-sm">
          Connect an OpenAI API key in{" "}
          <Link href="/settings/openai" className="underline">
            Settings
          </Link>{" "}
          before generating drafts.
        </div>
      ) : null}

      <Card className="border-border/80 rounded-2xl shadow-none">
        <CardHeader>
          <CardTitle>Application</CardTitle>
          <CardDescription>
            Requires a selected target role, linked CV, and reviewed candidate
            profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {applications.length === 0 ? (
            <EmptyState
              title="No applications yet"
              description="Create an application from a job detail page first."
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {applications.map((application) => {
                const active = application.id === selectedId;
                return (
                  <Link
                    key={application.id}
                    href={`/outreach?applicationId=${application.id}`}
                    className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                      active
                        ? "border-foreground bg-muted/40 font-medium"
                        : "border-border/80 hover:bg-muted/30"
                    }`}
                  >
                    {companyName.get(application.companyId) ?? "Company"} ·{" "}
                    {application.targetRole}
                  </Link>
                );
              })}
            </div>
          )}

          {selected ? (
            <p className="text-muted-foreground text-sm">
              {jobTitle.get(selected.jobId) ?? "Job"} · status {selected.status}{" "}
              ·{" "}
              <Link href={`/jobs/${selected.jobId}`} className="underline">
                open job
              </Link>
            </p>
          ) : null}
        </CardContent>
      </Card>

      {selected ? (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <form action={generateJobMatchAction}>
              <input type="hidden" name="applicationId" value={selected.id} />
              <PendingSubmitButton
                idleLabel="Generate job match"
                pendingLabel="Analyzing…"
              />
            </form>
            <form action={generateOutreachEmailAction}>
              <input type="hidden" name="applicationId" value={selected.id} />
              <PendingSubmitButton
                idleLabel="Generate email draft"
                pendingLabel="Drafting…"
              />
            </form>
            <form action={generateLinkedInDraftAction}>
              <input type="hidden" name="applicationId" value={selected.id} />
              <PendingSubmitButton
                idleLabel="Generate LinkedIn draft"
                pendingLabel="Drafting…"
              />
            </form>
          </div>

          {matchOutput ? (
            <Card className="border-border/80 rounded-2xl shadow-none">
              <CardHeader>
                <CardTitle>Job-match analysis</CardTitle>
                <CardDescription>
                  Descriptive fit only. No hiring-probability claim.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {matchOutput.descriptiveFitNote ? (
                  <p>{matchOutput.descriptiveFitNote}</p>
                ) : null}
                <section>
                  <p className="font-medium">Matched</p>
                  <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5">
                    {matchOutput.matched.map((item) => (
                      <li key={item.requirement}>
                        {item.requirement} — {item.evidence}
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <p className="font-medium">Partial</p>
                  <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5">
                    {matchOutput.partial.map((item) => (
                      <li key={item.requirement}>
                        {item.requirement}: {item.gap}
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <p className="font-medium">Missing</p>
                  <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5">
                    {matchOutput.missing.map((item) => (
                      <li key={item.requirement}>
                        {item.requirement}: {item.note}
                      </li>
                    ))}
                  </ul>
                </section>
                {(latestMatch?.warnings.length ?? 0) > 0 ? (
                  <div className="border-border/70 bg-muted/20 rounded-xl border p-3">
                    {latestMatch!.warnings.map((warning) => (
                      <p key={warning}>{warning}</p>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {emailOutput && latestEmail ? (
            <Card className="border-border/80 rounded-2xl shadow-none">
              <CardHeader>
                <CardTitle>Email draft</CardTitle>
                <CardDescription>
                  Edit freely, then accept. Sending is Phase 4.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={acceptOutreachEmailAction} className="space-y-4">
                  <input
                    type="hidden"
                    name="applicationId"
                    value={selected.id}
                  />
                  <input
                    type="hidden"
                    name="generationId"
                    value={latestEmail.id}
                  />
                  <input
                    type="hidden"
                    name="factsUsed"
                    value={JSON.stringify(emailOutput.factsUsed)}
                  />
                  <input
                    type="hidden"
                    name="warnings"
                    value={JSON.stringify(
                      latestEmail.warnings.length
                        ? latestEmail.warnings
                        : emailOutput.warnings,
                    )}
                  />
                  <input
                    type="hidden"
                    name="missingInformation"
                    value={JSON.stringify(emailOutput.missingInformation)}
                  />
                  <input
                    type="hidden"
                    name="html"
                    value={emailOutput.html ?? ""}
                  />

                  <div className="space-y-2">
                    <RequiredLabel htmlFor="subject">Subject</RequiredLabel>
                    <Input
                      id="subject"
                      name="subject"
                      defaultValue={emailOutput.subject}
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <RequiredLabel htmlFor="plainText">
                      Email body
                    </RequiredLabel>
                    <textarea
                      id="plainText"
                      name="plainText"
                      rows={8}
                      defaultValue={emailOutput.plainText}
                      className="border-input bg-background focus-visible:ring-ring flex w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <RequiredLabel htmlFor="coverLetterPlainText">
                      Cover letter
                    </RequiredLabel>
                    <textarea
                      id="coverLetterPlainText"
                      name="coverLetterPlainText"
                      rows={10}
                      defaultValue={emailOutput.coverLetterPlainText}
                      className="border-input bg-background focus-visible:ring-ring flex w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Facts used</p>
                    <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
                      {emailOutput.factsUsed.map((fact) => (
                        <li
                          key={`${fact.outputFragment}-${fact.sourceFactIds.join(",")}`}
                        >
                          {fact.outputFragment} ←{" "}
                          {fact.sourceFactIds.join(", ")}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {(latestEmail.warnings.length > 0 ||
                    emailOutput.missingInformation.length > 0) && (
                    <div className="border-border/70 bg-muted/20 text-muted-foreground space-y-1 rounded-xl border p-3 text-sm">
                      {[
                        ...latestEmail.warnings,
                        ...emailOutput.missingInformation.map(
                          (item) => `Missing: ${item}`,
                        ),
                      ].map((warning) => (
                        <p key={warning}>{warning}</p>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <PendingSubmitButton
                      idleLabel="Accept email draft"
                      pendingLabel="Saving…"
                    />
                    {latestEmail.acceptedAt ? (
                      <Badge className="rounded-full px-3 py-1 text-xs">
                        Accepted
                      </Badge>
                    ) : null}
                    <Badge
                      variant="secondary"
                      className="rounded-full px-3 py-1 text-xs"
                    >
                      {latestEmail.promptVersion} · {latestEmail.model}
                    </Badge>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}

          {linkedInOutput && latestLinkedIn ? (
            <Card className="border-border/80 rounded-2xl shadow-none">
              <CardHeader>
                <CardTitle>LinkedIn draft</CardTitle>
                <CardDescription>
                  Copy and send manually. No LinkedIn automation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={acceptLinkedInDraftAction} className="space-y-4">
                  <input
                    type="hidden"
                    name="applicationId"
                    value={selected.id}
                  />
                  <input
                    type="hidden"
                    name="generationId"
                    value={latestLinkedIn.id}
                  />
                  <input
                    type="hidden"
                    name="factsUsed"
                    value={JSON.stringify(linkedInOutput.factsUsed)}
                  />
                  <input
                    type="hidden"
                    name="warnings"
                    value={JSON.stringify(
                      latestLinkedIn.warnings.length
                        ? latestLinkedIn.warnings
                        : linkedInOutput.warnings,
                    )}
                  />
                  <input
                    type="hidden"
                    name="missingInformation"
                    value={JSON.stringify(linkedInOutput.missingInformation)}
                  />

                  <div className="space-y-2">
                    <RequiredLabel htmlFor="connectionNote">
                      Connection note
                    </RequiredLabel>
                    <textarea
                      id="connectionNote"
                      name="connectionNote"
                      rows={3}
                      defaultValue={linkedInOutput.connectionNote}
                      className="border-input bg-background focus-visible:ring-ring flex w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <RequiredLabel htmlFor="message">Message</RequiredLabel>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      defaultValue={linkedInOutput.message}
                      className="border-input bg-background focus-visible:ring-ring flex w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <CopyTextButton
                      text={linkedInOutput.connectionNote}
                      idleLabel="Copy connection note"
                    />
                    <CopyTextButton
                      text={linkedInOutput.message}
                      idleLabel="Copy message"
                    />
                    <a
                      href="https://www.linkedin.com/messaging/"
                      target="_blank"
                      rel="noreferrer"
                      className="border-border hover:bg-muted/40 inline-flex h-9 items-center rounded-xl border px-4 text-sm"
                    >
                      Open LinkedIn messaging
                    </a>
                    <PendingSubmitButton
                      idleLabel="Accept LinkedIn draft"
                      pendingLabel="Saving…"
                    />
                    {latestLinkedIn.acceptedAt ? (
                      <Badge className="rounded-full px-3 py-1 text-xs">
                        Accepted
                      </Badge>
                    ) : null}
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </FadeIn>
  );
}
