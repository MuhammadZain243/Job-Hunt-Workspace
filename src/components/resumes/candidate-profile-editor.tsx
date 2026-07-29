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

type Evidence = {
  source: string;
  excerpt?: string;
};

type CandidateProfileEditorProps = {
  resumeId: string;
  profile: {
    headline: string;
    summary: string;
    contact: {
      email: string;
      phone: string;
      location: string;
      linkedinUrl: string;
    };
    skills: Array<{ name: string; evidence?: Evidence }>;
    experience: Array<{
      title: string;
      company: string;
      startDate?: string;
      endDate?: string;
      bullets?: string[];
      evidence?: Evidence;
    }>;
    education: Array<{
      school: string;
      degree: string;
      field?: string;
      evidence?: Evidence;
    }>;
    projects: Array<{
      name: string;
      description?: string;
      evidence?: Evidence;
    }>;
    achievements: Array<{
      text: string;
      evidence?: Evidence;
    }>;
    reviewStatus: "draft" | "reviewed";
  };
};

function EvidenceNote({ evidence }: { evidence?: Evidence }) {
  if (!evidence?.excerpt) {
    return null;
  }

  return (
    <p className="text-muted-foreground mt-1 text-xs leading-5">
      Evidence ({evidence.source}): {evidence.excerpt}
    </p>
  );
}

export function CandidateProfileEditor({
  resumeId,
  profile,
}: CandidateProfileEditorProps) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="border-border/80 bg-muted/20 space-y-4 rounded-2xl border p-4">
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
          <RequiredLabel htmlFor={`headline-${resumeId}`}>
            Headline
          </RequiredLabel>
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

        <div className="grid gap-3 sm:grid-cols-2">
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
          <div className="space-y-2">
            <RequiredLabel htmlFor={`linkedin-${resumeId}`}>
              LinkedIn URL
            </RequiredLabel>
            <Input
              id={`linkedin-${resumeId}`}
              name="contactLinkedinUrl"
              defaultValue={profile.contact.linkedinUrl}
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

      {profile.experience.length > 0 ? (
        <section className="space-y-2">
          <p className="text-sm font-medium">Experience</p>
          <ul className="space-y-3">
            {profile.experience.map((item, index) => (
              <li
                key={`${item.title}-${item.company}-${index}`}
                className="border-border/70 bg-background/70 rounded-xl border p-3 text-sm"
              >
                <p className="font-medium">
                  {item.title}
                  {item.company ? ` · ${item.company}` : ""}
                </p>
                {item.startDate || item.endDate ? (
                  <p className="text-muted-foreground text-xs">
                    {[item.startDate, item.endDate].filter(Boolean).join(" – ")}
                  </p>
                ) : null}
                {item.bullets && item.bullets.length > 0 ? (
                  <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-4">
                    {item.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
                <EvidenceNote evidence={item.evidence} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {profile.education.length > 0 ? (
        <section className="space-y-2">
          <p className="text-sm font-medium">Education</p>
          <ul className="space-y-3">
            {profile.education.map((item, index) => (
              <li
                key={`${item.school}-${index}`}
                className="border-border/70 bg-background/70 rounded-xl border p-3 text-sm"
              >
                <p className="font-medium">{item.school}</p>
                <p className="text-muted-foreground">
                  {[item.degree, item.field].filter(Boolean).join(" · ")}
                </p>
                <EvidenceNote evidence={item.evidence} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {profile.projects.length > 0 ? (
        <section className="space-y-2">
          <p className="text-sm font-medium">Projects</p>
          <ul className="space-y-3">
            {profile.projects.map((item, index) => (
              <li
                key={`${item.name}-${index}`}
                className="border-border/70 bg-background/70 rounded-xl border p-3 text-sm"
              >
                <p className="font-medium">{item.name}</p>
                {item.description ? (
                  <p className="text-muted-foreground">{item.description}</p>
                ) : null}
                <EvidenceNote evidence={item.evidence} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {profile.achievements.length > 0 ? (
        <section className="space-y-2">
          <p className="text-sm font-medium">Achievements</p>
          <ul className="space-y-3">
            {profile.achievements.map((item, index) => (
              <li
                key={`${item.text}-${index}`}
                className="border-border/70 bg-background/70 rounded-xl border p-3 text-sm"
              >
                <p>{item.text}</p>
                <EvidenceNote evidence={item.evidence} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
