import type { Metadata } from "next";
import Link from "next/link";

import {
  deleteCompanyAction,
  updateCompanyAction,
} from "@/app/(workspace)/companies/actions";
import {
  createContactAction,
  deleteContactAction,
  suppressContactAction,
  updateContactAction,
} from "@/app/(workspace)/contacts/actions";
import { CompanyDetailTabs } from "@/components/companies/company-detail-tabs";
import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
import { RequiredLabel } from "@/components/forms/required-label";
import { FadeIn } from "@/components/motion/fade-in";
import { SettingsFeedbackToast } from "@/components/settings/settings-feedback-toast";
import { EmptyState } from "@/components/states/empty-state";
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
import { listJobs } from "@/modules/jobs/job.service";

export const metadata: Metadata = {
  title: "Company",
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
    const messages: Record<string, string> = {
      created: "Company ready.",
      updated: "Company updated.",
      "contact-created": "Contact added.",
      "contact-updated": "Contact updated.",
      "contact-suppressed": "Contact suppressed.",
      "contact-deleted": "Contact deleted.",
    };
    const errors: Record<string, string> = {
      duplicate: "A company with this name or domain already exists.",
      "contact-create-failed": "Could not create the contact.",
      "contact-update-failed": "Could not update the contact.",
      "update-failed": "Could not update the company.",
    };
    return {
      success: success ? (messages[success] ?? "Done.") : undefined,
      error: error ? (errors[error] ?? "Something went wrong.") : undefined,
      tab: value("tab") === "contacts" ? "contacts" : "jobs",
    };
  });
}

export default async function CompanyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireSessionOrRedirect();
  const { id } = await params;
  const [company, contacts, jobs, feedback] = await Promise.all([
    getCompany(user.id, id),
    listContacts(user.id, { companyId: id }),
    listJobs(user.id, { companyId: id }),
    getFeedback(searchParams),
  ]);

  const activeTab = feedback.tab as "jobs" | "contacts";

  return (
    <FadeIn className="space-y-6">
      <SettingsFeedbackToast
        success={feedback.success}
        error={feedback.error}
        clearPath={`/companies/${id}?tab=${activeTab}`}
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">
            <Link href="/companies" className="hover:underline">
              Companies
            </Link>
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {company.name}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {[company.domain, company.industry].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
          {company.verificationStatus}
        </Badge>
      </div>

      <Card className="border-border/80 rounded-2xl shadow-none">
        <CardHeader>
          <CardTitle>Company details</CardTitle>
          <CardDescription>
            Deleting a company also removes its jobs, contacts, and
            applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={updateCompanyAction}
            className="grid gap-4 sm:grid-cols-2"
          >
            <input type="hidden" name="companyId" value={company.id} />
            <div className="space-y-2 sm:col-span-2">
              <RequiredLabel htmlFor="name" required>
                Name
              </RequiredLabel>
              <Input
                id="name"
                name="name"
                defaultValue={company.name}
                required
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="domain">Domain</RequiredLabel>
              <Input
                id="domain"
                name="domain"
                defaultValue={company.domain}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="industry">Industry</RequiredLabel>
              <Input
                id="industry"
                name="industry"
                defaultValue={company.industry}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="websiteUrl">Website</RequiredLabel>
              <Input
                id="websiteUrl"
                name="websiteUrl"
                defaultValue={company.websiteUrl}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="linkedinUrl">LinkedIn URL</RequiredLabel>
              <Input
                id="linkedinUrl"
                name="linkedinUrl"
                defaultValue={company.linkedinUrl}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <RequiredLabel htmlFor="summary">Summary</RequiredLabel>
              <textarea
                id="summary"
                name="summary"
                defaultValue={company.summary}
                rows={3}
                className="border-input bg-background focus-visible:ring-ring flex w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2"
              />
            </div>
            <div className="sm:col-span-2">
              <PendingSubmitButton
                idleLabel="Save company"
                pendingLabel="Saving…"
              />
            </div>
          </form>

          <form action={deleteCompanyAction}>
            <input type="hidden" name="companyId" value={company.id} />
            <Button
              type="submit"
              variant="outline"
              className="text-destructive h-9 rounded-xl"
            >
              Delete company
            </Button>
          </form>
        </CardContent>
      </Card>

      <CompanyDetailTabs
        companyId={company.id}
        activeTab={activeTab}
        jobCount={jobs.length}
        contactCount={contacts.length}
      />

      {activeTab === "jobs" ? (
        <Card className="border-border/80 rounded-2xl shadow-none">
          <CardHeader>
            <CardTitle>Jobs</CardTitle>
            <CardDescription>
              Manual imports attached to this company.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href={`/jobs?companyId=${company.id}`}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center rounded-xl px-4 text-sm font-medium"
            >
              Import job
            </Link>
            {jobs.length === 0 ? (
              <EmptyState
                title="No jobs yet"
                description="Import a job posting with a URL and pasted text."
              />
            ) : (
              jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="border-border/70 hover:bg-muted/30 block rounded-xl border p-3 text-sm"
                >
                  <p className="font-medium">{job.title}</p>
                  <p className="text-muted-foreground">
                    {job.selectedRoleTitle
                      ? `Target: ${job.selectedRoleTitle}`
                      : "Target role not selected"}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Updated {job.updatedAt.toISOString().slice(0, 10)}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/80 rounded-2xl shadow-none">
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>
              HR or recruiter contacts. No automatic LinkedIn collection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={createContactAction} className="space-y-3">
              <input type="hidden" name="companyId" value={company.id} />
              <input
                type="hidden"
                name="returnTo"
                value={`/companies/${company.id}?tab=contacts`}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <RequiredLabel htmlFor="fullName" required>
                    Full name
                  </RequiredLabel>
                  <Input
                    id="fullName"
                    name="fullName"
                    required
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="title">Title</RequiredLabel>
                  <Input id="title" name="title" className="h-10 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="department">Department</RequiredLabel>
                  <Input
                    id="department"
                    name="department"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="email">Email</RequiredLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="linkedinUrl">
                    LinkedIn URL
                  </RequiredLabel>
                  <Input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="confidence">Confidence</RequiredLabel>
                  <Input
                    id="confidence"
                    name="confidence"
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    defaultValue={0.8}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="emailStatus">
                    Email status
                  </RequiredLabel>
                  <select
                    id="emailStatus"
                    name="emailStatus"
                    defaultValue="unknown"
                    className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2"
                  >
                    <option value="unknown">unknown</option>
                    <option value="inferred">inferred</option>
                    <option value="verified">verified</option>
                    <option value="bounced">bounced</option>
                  </select>
                </div>
              </div>
              <PendingSubmitButton
                idleLabel="Add contact"
                pendingLabel="Adding…"
              />
            </form>

            {contacts.length === 0 ? (
              <EmptyState
                title="No contacts yet"
                description="Add an HR or recruiter contact with email or LinkedIn URL."
              />
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="border-border/70 space-y-3 rounded-xl border p-3 text-sm"
                >
                  <form action={updateContactAction} className="space-y-3">
                    <input type="hidden" name="contactId" value={contact.id} />
                    <input type="hidden" name="companyId" value={company.id} />
                    <input
                      type="hidden"
                      name="returnTo"
                      value={`/companies/${company.id}?tab=contacts`}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <RequiredLabel
                          htmlFor={`edit-name-${contact.id}`}
                          required
                        >
                          Full name
                        </RequiredLabel>
                        <Input
                          id={`edit-name-${contact.id}`}
                          name="fullName"
                          defaultValue={contact.fullName}
                          required
                          className="h-10 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <RequiredLabel htmlFor={`edit-title-${contact.id}`}>
                          Title
                        </RequiredLabel>
                        <Input
                          id={`edit-title-${contact.id}`}
                          name="title"
                          defaultValue={contact.title}
                          className="h-10 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <RequiredLabel
                          htmlFor={`edit-department-${contact.id}`}
                        >
                          Department
                        </RequiredLabel>
                        <Input
                          id={`edit-department-${contact.id}`}
                          name="department"
                          defaultValue={contact.department}
                          className="h-10 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <RequiredLabel htmlFor={`edit-email-${contact.id}`}>
                          Email
                        </RequiredLabel>
                        <Input
                          id={`edit-email-${contact.id}`}
                          name="email"
                          type="email"
                          defaultValue={contact.email}
                          className="h-10 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <RequiredLabel htmlFor={`edit-linkedin-${contact.id}`}>
                          LinkedIn URL
                        </RequiredLabel>
                        <Input
                          id={`edit-linkedin-${contact.id}`}
                          name="linkedinUrl"
                          defaultValue={contact.linkedinUrl}
                          className="h-10 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <RequiredLabel
                          htmlFor={`edit-confidence-${contact.id}`}
                        >
                          Confidence
                        </RequiredLabel>
                        <Input
                          id={`edit-confidence-${contact.id}`}
                          name="confidence"
                          type="number"
                          min={0}
                          max={1}
                          step={0.1}
                          defaultValue={contact.confidence}
                          className="h-10 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <RequiredLabel htmlFor={`edit-status-${contact.id}`}>
                          Email status
                        </RequiredLabel>
                        <select
                          id={`edit-status-${contact.id}`}
                          name="emailStatus"
                          defaultValue={contact.emailStatus}
                          className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2"
                        >
                          <option value="unknown">unknown</option>
                          <option value="inferred">inferred</option>
                          <option value="verified">verified</option>
                          <option value="bounced">bounced</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <PendingSubmitButton
                        idleLabel="Save contact"
                        pendingLabel="Saving…"
                      />
                      {contact.suppressedAt ? (
                        <Badge
                          variant="secondary"
                          className="rounded-full px-2.5 py-0.5 text-xs"
                        >
                          suppressed
                        </Badge>
                      ) : null}
                    </div>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {!contact.suppressedAt ? (
                      <form action={suppressContactAction}>
                        <input
                          type="hidden"
                          name="contactId"
                          value={contact.id}
                        />
                        <input
                          type="hidden"
                          name="returnTo"
                          value={`/companies/${company.id}?tab=contacts`}
                        />
                        <Button
                          type="submit"
                          variant="outline"
                          className="h-8 rounded-xl"
                        >
                          Suppress
                        </Button>
                      </form>
                    ) : null}
                    <form action={deleteContactAction}>
                      <input
                        type="hidden"
                        name="contactId"
                        value={contact.id}
                      />
                      <input
                        type="hidden"
                        name="returnTo"
                        value={`/companies/${company.id}?tab=contacts`}
                      />
                      <Button
                        type="submit"
                        variant="outline"
                        className="text-destructive h-8 rounded-xl"
                      >
                        Delete
                      </Button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </FadeIn>
  );
}
