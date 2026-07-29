import type { Metadata } from "next";
import Link from "next/link";

import { transitionApplicationAction } from "@/app/(workspace)/applications/actions";
import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
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
import { requireSessionOrRedirect } from "@/lib/auth/session";
import {
  applicationStatusValues,
  canTransitionApplication,
  type ApplicationStatus,
} from "@/modules/applications/application.transitions";
import { listApplications } from "@/modules/applications/application.service";
import { listCompanies } from "@/modules/companies/company.service";
import { listJobs } from "@/modules/jobs/job.service";

export const metadata: Metadata = {
  title: "Applications",
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
        success === "created"
          ? "Application created."
          : success === "status-updated"
            ? "Application status updated."
            : undefined,
      error: error ? "Could not update the application." : undefined,
    };
  });
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireSessionOrRedirect();
  const [applications, companies, jobs, feedback] = await Promise.all([
    listApplications(user.id),
    listCompanies(user.id),
    listJobs(user.id),
    getFeedback(searchParams),
  ]);

  const companyName = new Map(
    companies.map((company) => [company.id, company.name]),
  );
  const jobTitle = new Map(jobs.map((job) => [job.id, job.title]));

  return (
    <FadeIn className="space-y-6">
      <SettingsFeedbackToast
        success={feedback.success}
        error={feedback.error}
        clearPath="/applications"
      />

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Applications</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          Track validated status transitions, next actions, and history for each
          job and target role.
        </p>
      </div>

      <Card className="border-border/80 rounded-2xl shadow-none">
        <CardHeader>
          <CardTitle>Pipeline</CardTitle>
          <CardDescription>
            Create applications from a job detail page after selecting a target
            role.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {applications.length === 0 ? (
            <EmptyState
              title="No applications yet"
              description="Import a job, select a target role, then create an application."
            />
          ) : (
            applications.map((application) => {
              const nextStatuses = applicationStatusValues.filter((status) =>
                canTransitionApplication(
                  application.status,
                  status as ApplicationStatus,
                ),
              );

              return (
                <div
                  key={application.id}
                  className="border-border/80 bg-background/70 space-y-3 rounded-2xl border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {jobTitle.get(application.jobId) ?? "Job"} ·{" "}
                        {application.targetRole}
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {companyName.get(application.companyId) ?? "Company"}
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Next: {application.nextAction}
                      </p>
                    </div>
                    <Badge className="rounded-full px-3 py-1 text-xs">
                      {application.status}
                    </Badge>
                  </div>

                  <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
                    {application.statusHistory.slice(-3).map((entry, index) => (
                      <span key={`${entry.to}-${index}`}>
                        {entry.from} → {entry.to}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/jobs/${application.jobId}`}
                      className="text-sm underline"
                    >
                      Open job
                    </Link>
                    {nextStatuses.length > 0 ? (
                      <form
                        action={transitionApplicationAction}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <input
                          type="hidden"
                          name="applicationId"
                          value={application.id}
                        />
                        <select
                          name="nextStatus"
                          className="border-input bg-background h-9 rounded-xl border px-3 text-sm"
                          defaultValue={nextStatuses[0]}
                        >
                          {nextStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <PendingSubmitButton
                          idleLabel="Update status"
                          pendingLabel="Updating…"
                        />
                      </form>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </FadeIn>
  );
}
