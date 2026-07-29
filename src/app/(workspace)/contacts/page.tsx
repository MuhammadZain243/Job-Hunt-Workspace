import type { Metadata } from "next";
import Link from "next/link";

import {
  deleteContactAction,
  suppressContactAction,
} from "@/app/(workspace)/contacts/actions";
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
import { requireSessionOrRedirect } from "@/lib/auth/session";
import { listCompanies } from "@/modules/companies/company.service";
import { listContacts } from "@/modules/contacts/contact.service";

export const metadata: Metadata = {
  title: "Contacts",
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
        success === "contact-suppressed"
          ? "Contact suppressed."
          : success === "contact-deleted"
            ? "Contact deleted."
            : success === "contact-created"
              ? "Contact created."
              : undefined,
      error: error ? "Could not update the contact." : undefined,
    };
  });
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireSessionOrRedirect();
  const [contacts, companies, feedback] = await Promise.all([
    listContacts(user.id),
    listCompanies(user.id),
    getFeedback(searchParams),
  ]);

  const companyName = new Map(
    companies.map((company) => [company.id, company.name]),
  );

  return (
    <FadeIn className="space-y-6">
      <SettingsFeedbackToast
        success={feedback.success}
        error={feedback.error}
        clearPath="/contacts"
      />

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Contacts</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          HR and recruiter contacts with source confidence. Suppression stops
          future outreach targeting.
        </p>
      </div>

      <Card className="border-border/80 rounded-2xl shadow-none">
        <CardHeader>
          <CardTitle>All contacts</CardTitle>
          <CardDescription>
            Add contacts from a company detail page. LinkedIn stays
            copy-and-open only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {contacts.length === 0 ? (
            <EmptyState
              title="No contacts yet"
              description="Open a company and add an HR or recruiter contact there."
            />
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                className="border-border/80 bg-background/70 space-y-3 rounded-2xl border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{contact.fullName}</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {[
                        companyName.get(contact.companyId),
                        contact.title,
                        contact.email,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Confidence {Math.round(contact.confidence * 100)}% ·{" "}
                      {contact.emailStatus} · {contact.source.sourceType}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contact.suppressedAt ? (
                      <Badge
                        variant="secondary"
                        className="rounded-full px-3 py-1 text-xs"
                      >
                        suppressed
                      </Badge>
                    ) : null}
                    <Link
                      href={`/companies/${contact.companyId}`}
                      className="text-sm underline"
                    >
                      Company
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!contact.suppressedAt ? (
                    <form action={suppressContactAction}>
                      <input
                        type="hidden"
                        name="contactId"
                        value={contact.id}
                      />
                      <input type="hidden" name="returnTo" value="/contacts" />
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
                    <input type="hidden" name="contactId" value={contact.id} />
                    <input type="hidden" name="returnTo" value="/contacts" />
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
    </FadeIn>
  );
}
