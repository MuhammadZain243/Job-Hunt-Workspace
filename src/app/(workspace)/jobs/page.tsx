import type { Metadata } from "next";
import Link from "next/link";

import { importJobAction } from "@/app/(workspace)/jobs/actions";
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
import { listCompanies } from "@/modules/companies/company.service";
import { listJobs } from "@/modules/jobs/job.service";

export const metadata: Metadata = {
  title: "Jobs",
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
    return {
      success:
        success === "imported"
          ? "Job imported. Review and select a target role."
          : success === "deleted"
            ? "Job deleted."
            : undefined,
      error: error
        ? "Could not import the job. Check the pasted text."
        : undefined,
      companyId: value("companyId"),
    };
  });
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireSessionOrRedirect();
  const [jobs, companies, feedback] = await Promise.all([
    listJobs(user.id),
    listCompanies(user.id),
    getFeedback(searchParams),
  ]);

  return (
    <FadeIn className="space-y-6">
      <SettingsFeedbackToast
        success={feedback.success}
        error={feedback.error}
        clearPath="/jobs"
      />

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Jobs</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          Import jobs manually with a source URL and pasted text. Extraction is
          deterministic and strips prompt-injection phrases.
        </p>
      </div>

      <Card className="border-border/80 rounded-2xl shadow-none">
        <CardHeader>
          <CardTitle>Manual job import</CardTitle>
          <CardDescription>
            Paste the public posting text. Do not paste private messages or
            scraped LinkedIn content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <EmptyState
              title="Create a company first"
              description="Jobs must belong to a company before import."
            />
          ) : (
            <form action={importJobAction} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <RequiredLabel htmlFor="companyId" required>
                    Company
                  </RequiredLabel>
                  <select
                    id="companyId"
                    name="companyId"
                    required
                    defaultValue={feedback.companyId ?? ""}
                    className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2"
                  >
                    <option value="" disabled>
                      Select company
                    </option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="sourceUrl">Source URL</RequiredLabel>
                  <Input
                    id="sourceUrl"
                    name="sourceUrl"
                    className="h-10 rounded-xl"
                    placeholder="https://careers.example.com/job/123"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor="pastedText" required>
                  Pasted job text
                </RequiredLabel>
                <textarea
                  id="pastedText"
                  name="pastedText"
                  required
                  rows={10}
                  minLength={20}
                  className="border-input bg-background focus-visible:ring-ring flex w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                  placeholder="Paste the job title, description, requirements..."
                />
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor="applicationUrl">
                  Application URL
                </RequiredLabel>
                <Input
                  id="applicationUrl"
                  name="applicationUrl"
                  className="h-10 rounded-xl"
                />
              </div>
              <PendingSubmitButton
                idleLabel="Import job"
                pendingLabel="Importing…"
              />
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80 rounded-2xl shadow-none">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Imported jobs</CardTitle>
            <CardDescription>
              Select a target role before creating an application.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
            {jobs.length} total
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {jobs.length === 0 ? (
            <EmptyState
              title="No jobs yet"
              description="Import a posting to start reviewing roles and applications."
            />
          ) : (
            jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="border-border/80 bg-background/70 hover:bg-muted/30 block rounded-2xl border p-4 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{job.title}</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {job.selectedRoleTitle
                        ? `Target role: ${job.selectedRoleTitle}`
                        : `${job.roleOptions.length} role option(s) · selection required`}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="rounded-full px-3 py-1 text-xs"
                  >
                    {job.status}
                  </Badge>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </FadeIn>
  );
}
