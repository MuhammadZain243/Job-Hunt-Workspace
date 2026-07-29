import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSessionOrRedirect } from "@/lib/auth/session";
import { getApplicationDashboardSummary } from "@/modules/applications/application.service";
import { countCompanies } from "@/modules/companies/company.service";
import { countContacts } from "@/modules/contacts/contact.service";
import { countJobs } from "@/modules/jobs/job.service";
import { listResumes } from "@/modules/resumes/resume.service";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const { user } = await requireSessionOrRedirect();
  const [summary, companyCount, jobCount, contactCount, resumes] =
    await Promise.all([
      getApplicationDashboardSummary(user.id),
      countCompanies(user.id),
      countJobs(user.id),
      countContacts(user.id),
      listResumes(user.id),
    ]);

  return (
    <FadeIn className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-6">
            Track companies, jobs, contacts, and application next actions from
            one calm workspace.
          </p>
        </div>

        <Link
          href="/jobs"
          className="border-border hover:bg-muted/40 inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium"
        >
          Add job
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Companies", value: companyCount, href: "/companies" },
          { label: "Jobs", value: jobCount, href: "/jobs" },
          { label: "Contacts", value: contactCount, href: "/contacts" },
          {
            label: "Applications",
            value: summary.total,
            href: "/applications",
          },
        ].map((item) => (
          <Link key={item.label} href={item.href}>
            <Card className="border-border/80 hover:bg-muted/20 rounded-2xl shadow-none transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  {item.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight">
                  {item.value}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-border/80 rounded-2xl shadow-none">
        <CardHeader>
          <CardTitle>Active applications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.recentActive.length === 0 ? (
            <EmptyState
              title="No active applications"
              description="Create a company, import a job, select a target role, then open an application."
            />
          ) : (
            summary.recentActive.map((application) => (
              <div
                key={application.id}
                className="border-border/70 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {application.targetRole}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {application.nextAction}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="rounded-full px-3 py-1 text-xs"
                >
                  {application.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-sm">
        {resumes.length} CV version{resumes.length === 1 ? "" : "s"} in the{" "}
        <Link href="/cv-library" className="underline">
          CV Library
        </Link>
        .
      </p>
    </FadeIn>
  );
}
