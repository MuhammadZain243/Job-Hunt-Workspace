import type { Metadata } from "next";
import Link from "next/link";

import { createApplicationAction } from "@/app/(workspace)/applications/actions";
import {
  deleteJobAction,
  selectJobRoleAction,
  updateJobReviewAction,
} from "@/app/(workspace)/jobs/actions";
import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
import { RequiredLabel } from "@/components/forms/required-label";
import { FadeIn } from "@/components/motion/fade-in";
import { SettingsFeedbackToast } from "@/components/settings/settings-feedback-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireSessionOrRedirect } from "@/lib/auth/session";
import { getCompany } from "@/modules/companies/company.service";
import { listContacts } from "@/modules/contacts/contact.service";
import { getJob } from "@/modules/jobs/job.service";
import { listResumes } from "@/modules/resumes/resume.service";

export const metadata: Metadata = {
  title: "Job detail",
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
    const successMessages: Record<string, string> = {
      imported: "Job imported.",
      "role-selected": "Target role selected.",
      reviewed: "Job review saved.",
    };
    const errorMessages: Record<string, string> = {
      "role-required": "Select a target role before creating an application.",
      "application-exists":
        "An application already exists for this job and target role.",
      "application-failed": "Could not create the application.",
      "role-failed": "Could not select that role.",
      "review-failed": "Could not save the review.",
    };
    return {
      success: success ? (successMessages[success] ?? "Done.") : undefined,
      error: error
        ? (errorMessages[error] ?? "Something went wrong.")
        : undefined,
    };
  });
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireSessionOrRedirect();
  const { id } = await params;
  const job = await getJob(user.id, id);
  const [company, contacts, resumes, feedback] = await Promise.all([
    getCompany(user.id, job.companyId),
    listContacts(user.id, { companyId: job.companyId }),
    listResumes(user.id),
    getFeedback(searchParams),
  ]);

  return (
    <FadeIn className="space-y-6">
      <SettingsFeedbackToast
        success={feedback.success}
        error={feedback.error}
        clearPath={`/jobs/${id}`}
      />

      <div>
        <p className="text-muted-foreground text-sm">
          <Link href="/jobs" className="hover:underline">
            Jobs
          </Link>
          {" · "}
          <Link href={`/companies/${company.id}`} className="hover:underline">
            {company.name}
          </Link>
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {job.title}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {[job.location, job.workplaceType, job.employmentType]
            .filter(Boolean)
            .join(" · ") || "Review extracted details below"}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Source freshness: updated {job.updatedAt.toISOString().slice(0, 10)}
          {job.sourceUrl ? " · URL captured" : " · pasted text only"}
        </p>
      </div>

      {job.extractionWarnings.length > 0 ? (
        <div className="border-border/80 bg-muted/25 text-muted-foreground rounded-2xl border p-4 text-sm">
          {job.extractionWarnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <Card className="border-border/80 rounded-2xl shadow-none">
        <CardHeader>
          <CardTitle>Target role</CardTitle>
          <CardDescription>
            Multiple role options require an explicit selection before
            application creation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {job.roleOptions.map((role) => (
            <form
              key={role.id}
              action={selectJobRoleAction}
              className="border-border/70 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
            >
              <input type="hidden" name="jobId" value={job.id} />
              <input type="hidden" name="roleId" value={role.id} />
              <div>
                <p className="text-sm font-medium">{role.title}</p>
                {job.selectedRoleId === role.id ? (
                  <Badge className="mt-1 rounded-full px-2.5 py-0.5 text-xs">
                    Selected
                  </Badge>
                ) : null}
              </div>
              <PendingSubmitButton
                idleLabel={
                  job.selectedRoleId === role.id ? "Selected" : "Select role"
                }
                pendingLabel="Saving…"
              />
            </form>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/80 rounded-2xl shadow-none">
        <CardHeader>
          <CardTitle>Review extracted facts</CardTitle>
          <CardDescription>
            Correct the structured fields. Source snapshot stays immutable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={updateJobReviewAction}
            className="grid gap-4 sm:grid-cols-2"
          >
            <input type="hidden" name="jobId" value={job.id} />
            <div className="space-y-2 sm:col-span-2">
              <RequiredLabel htmlFor="title" required>
                Title
              </RequiredLabel>
              <Input
                id="title"
                name="title"
                defaultValue={job.title}
                required
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="location">Location</RequiredLabel>
              <Input
                id="location"
                name="location"
                defaultValue={job.location}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="workplaceType">
                Workplace type
              </RequiredLabel>
              <Input
                id="workplaceType"
                name="workplaceType"
                defaultValue={job.workplaceType}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="employmentType">
                Employment type
              </RequiredLabel>
              <Input
                id="employmentType"
                name="employmentType"
                defaultValue={job.employmentType}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="applicationUrl">
                Application URL
              </RequiredLabel>
              <Input
                id="applicationUrl"
                name="applicationUrl"
                defaultValue={job.applicationUrl}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <RequiredLabel htmlFor="requirementsText">
                Requirements (one per line)
              </RequiredLabel>
              <textarea
                id="requirementsText"
                name="requirementsText"
                rows={5}
                defaultValue={job.requirements.join("\n")}
                className="border-input bg-background focus-visible:ring-ring flex w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <RequiredLabel htmlFor="responsibilitiesText">
                Responsibilities (one per line)
              </RequiredLabel>
              <textarea
                id="responsibilitiesText"
                name="responsibilitiesText"
                rows={5}
                defaultValue={job.responsibilities.join("\n")}
                className="border-input bg-background focus-visible:ring-ring flex w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <RequiredLabel htmlFor="skillsText">
                Skills (comma separated)
              </RequiredLabel>
              <textarea
                id="skillsText"
                name="skillsText"
                rows={3}
                defaultValue={job.skills.join(", ")}
                className="border-input bg-background focus-visible:ring-ring flex w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2"
              />
            </div>
            <div className="sm:col-span-2">
              <PendingSubmitButton
                idleLabel="Save review"
                pendingLabel="Saving…"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/80 rounded-2xl shadow-none">
        <CardHeader>
          <CardTitle>Create application</CardTitle>
          <CardDescription>
            One application per job and selected target role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createApplicationAction} className="space-y-4">
            <input type="hidden" name="jobId" value={job.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <RequiredLabel htmlFor="resumeId">CV</RequiredLabel>
                <select
                  id="resumeId"
                  name="resumeId"
                  className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2"
                  defaultValue={
                    resumes.find((resume) => resume.isDefault)?.id ?? ""
                  }
                >
                  <option value="">No CV linked</option>
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.name}
                      {resume.isDefault ? " (default)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor="primaryContactId">
                  Primary contact
                </RequiredLabel>
                <select
                  id="primaryContactId"
                  name="primaryContactId"
                  className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2"
                  defaultValue=""
                >
                  <option value="">No contact linked</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <PendingSubmitButton
              idleLabel="Create application"
              pendingLabel="Creating…"
            />
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/80 rounded-2xl shadow-none">
        <CardHeader>
          <CardTitle>Source snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {job.sourceUrl ? (
            <p>
              <span className="text-muted-foreground">URL: </span>
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {job.sourceUrl}
              </a>
            </p>
          ) : null}
          <pre className="border-border/70 bg-muted/20 max-h-80 overflow-auto rounded-xl border p-3 text-xs leading-5 whitespace-pre-wrap">
            {job.description}
          </pre>
          <form action={deleteJobAction}>
            <input type="hidden" name="jobId" value={job.id} />
            <Button
              type="submit"
              variant="outline"
              className="text-destructive h-9 rounded-xl"
            >
              Delete job
            </Button>
          </form>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
