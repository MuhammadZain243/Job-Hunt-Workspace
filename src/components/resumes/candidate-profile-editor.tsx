"use client";

import { useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import {
  markProfileReviewedAction,
  saveCandidateProfileAction,
} from "@/app/(workspace)/cv-library/actions";
import { RequiredLabel } from "@/components/forms/required-label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CandidateProfileEditorProps = {
  resumeId: string;
  profile: {
    headline: string;
    summary: string;
    contact: {
      email: string;
      phone: string;
      location: string;
    };
    skills: Array<{ name: string }>;
    reviewStatus: "draft" | "reviewed";
  };
};

export function CandidateProfileEditor({
  resumeId,
  profile,
}: CandidateProfileEditorProps) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4 rounded-2xl border border-border/80 bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Candidate profile</p>
        <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
          {profile.reviewStatus}
        </Badge>
      </div>

      <form
        action={(formData) => {
          startTransition(async () => {
            await saveCandidateProfileAction(formData);
          });
        }}
        className="space-y-3"
      >
        <input type="hidden" name="resumeId" value={resumeId} />

        <div className="space-y-2">
          <RequiredLabel htmlFor={`headline-${resumeId}`}>Headline</RequiredLabel>
          <Input
            id={`headline-${resumeId}`}
            name="headline"
            defaultValue={profile.headline}
            className="h-10 rounded-xl"
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <RequiredLabel htmlFor={`summary-${resumeId}`}>Summary</RequiredLabel>
          <textarea
            id={`summary-${resumeId}`}
            name="summary"
            defaultValue={profile.summary}
            rows={4}
            disabled={pending}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <RequiredLabel htmlFor={`email-${resumeId}`}>Email</RequiredLabel>
            <Input
              id={`email-${resumeId}`}
              name="contactEmail"
              defaultValue={profile.contact.email}
              className="h-10 rounded-xl"
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor={`phone-${resumeId}`}>Phone</RequiredLabel>
            <Input
              id={`phone-${resumeId}`}
              name="contactPhone"
              defaultValue={profile.contact.phone}
              className="h-10 rounded-xl"
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor={`location-${resumeId}`}>
              Location
            </RequiredLabel>
            <Input
              id={`location-${resumeId}`}
              name="contactLocation"
              defaultValue={profile.contact.location}
              className="h-10 rounded-xl"
              disabled={pending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <RequiredLabel htmlFor={`skills-${resumeId}`}>
            Skills (comma separated)
          </RequiredLabel>
          <Input
            id={`skills-${resumeId}`}
            name="skillsCsv"
            defaultValue={profile.skills.map((skill) => skill.name).join(", ")}
            className="h-10 rounded-xl"
            disabled={pending}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            className="h-9 rounded-xl px-4 text-sm font-medium"
            disabled={pending}
          >
            {pending ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save profile"
            )}
          </Button>
        </div>
      </form>

      {profile.reviewStatus !== "reviewed" ? (
        <form
          action={(formData) => {
            startTransition(async () => {
              await markProfileReviewedAction(formData);
            });
          }}
        >
          <input type="hidden" name="resumeId" value={resumeId} />
          <Button
            type="submit"
            variant="outline"
            className="h-9 rounded-xl px-4 text-sm font-medium"
            disabled={pending}
          >
            Mark as reviewed
          </Button>
        </form>
      ) : null}
    </div>
  );
}
