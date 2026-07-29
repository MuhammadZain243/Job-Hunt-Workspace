import type { Metadata } from "next";
import Link from "next/link";

import { createCompanyAction } from "@/app/(workspace)/companies/actions";
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

export const metadata: Metadata = {
  title: "Companies",
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
          ? "Company created."
          : success === "deleted"
            ? "Company deleted."
            : success === "updated"
              ? "Company updated."
              : undefined,
      error:
        error === "duplicate"
          ? "A company with this name or domain already exists."
          : error
            ? "Could not save the company."
            : undefined,
    };
  });
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireSessionOrRedirect();
  const [companies, feedback] = await Promise.all([
    listCompanies(user.id),
    getFeedback(searchParams),
  ]);

  return (
    <FadeIn className="space-y-6">
      <SettingsFeedbackToast
        success={feedback.success}
        error={feedback.error}
        clearPath="/companies"
      />

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Companies</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          Track employers with source provenance. Duplicate names and domains
          are blocked.
        </p>
      </div>

      <Card className="border-border/80 rounded-2xl shadow-none">
        <CardHeader>
          <CardTitle>Add company</CardTitle>
          <CardDescription>
            Manual entry only. LinkedIn URLs are stored as references, never
            scraped.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={createCompanyAction}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2 sm:col-span-2">
              <RequiredLabel htmlFor="company-name" required>
                Company name
              </RequiredLabel>
              <Input
                id="company-name"
                name="name"
                required
                className="h-10 rounded-xl"
                placeholder="Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="company-domain">Domain</RequiredLabel>
              <Input
                id="company-domain"
                name="domain"
                className="h-10 rounded-xl"
                placeholder="acme.com"
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="company-industry">Industry</RequiredLabel>
              <Input
                id="company-industry"
                name="industry"
                className="h-10 rounded-xl"
                placeholder="Software"
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="company-website">Website</RequiredLabel>
              <Input
                id="company-website"
                name="websiteUrl"
                className="h-10 rounded-xl"
                placeholder="https://acme.com"
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="company-linkedin">
                LinkedIn URL
              </RequiredLabel>
              <Input
                id="company-linkedin"
                name="linkedinUrl"
                className="h-10 rounded-xl"
                placeholder="https://linkedin.com/company/acme"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <RequiredLabel htmlFor="company-summary">Summary</RequiredLabel>
              <textarea
                id="company-summary"
                name="summary"
                rows={3}
                className="border-input bg-background focus-visible:ring-ring flex w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2"
              />
            </div>
            <div className="sm:col-span-2">
              <PendingSubmitButton
                idleLabel="Create company"
                pendingLabel="Creating…"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/80 rounded-2xl shadow-none">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Company list</CardTitle>
            <CardDescription>
              Open a company to manage jobs and contacts.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
            {companies.length} total
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {companies.length === 0 ? (
            <EmptyState
              title="No companies yet"
              description="Create a company first, then import jobs and contacts against it."
            />
          ) : (
            companies.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className="border-border/80 bg-background/70 hover:bg-muted/30 block rounded-2xl border p-4 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {[company.domain, company.industry]
                        .filter(Boolean)
                        .join(" · ") || "No domain yet"}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="rounded-full px-3 py-1 text-xs"
                  >
                    {company.verificationStatus}
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
