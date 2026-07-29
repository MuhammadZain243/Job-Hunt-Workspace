import type { Metadata } from "next";

import { CandidateProfileEditor } from "@/components/resumes/candidate-profile-editor";
import { CvUploadForm } from "@/components/resumes/cv-upload-form";
import { ResumeActions } from "@/components/resumes/resume-actions";
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
import { getCandidateProfileForResume } from "@/modules/candidate-profile/candidate-profile.service";
import { listResumes } from "@/modules/resumes/resume.service";

export const metadata: Metadata = {
  title: "CV Library",
};

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFeedback(
  searchParams:
    Promise<Record<string, string | string[] | undefined>> | undefined,
): Promise<{ success?: string; error?: string }> {
  return Promise.resolve(searchParams).then((params) => {
    const getValue = (key: string) => {
      const value = params?.[key];
      return Array.isArray(value) ? value[0] : value;
    };

    const success = getValue("success");
    const error = getValue("error");
    const detail = getValue("detail");

    const successMessages: Record<string, string> = {
      uploaded: "CV uploaded. Extraction started.",
      renamed: "CV renamed.",
      "default-set": "Default CV updated.",
      deleted: "CV deleted from storage and the database.",
      processing: "Extraction queued.",
      "profile-saved": "Candidate profile saved.",
      "profile-reviewed": "Candidate profile marked as reviewed.",
    };

    const errorMessages: Record<string, string> = {
      "missing-file": "Choose a PDF or DOCX file to upload.",
      conflict: "This CV file was already uploaded.",
      validation_error: "The file failed validation.",
      provider_unavailable:
        detail ?? "Storage provider could not store the CV. Try again.",
      provider_auth_error:
        detail ??
        "Saved credentials could not be read. Disconnect and reconnect Cloudinary in Settings.",
      "upload-failed": detail ?? "Upload failed. Try again.",
      "rename-failed": "Could not rename the CV.",
      "default-failed": "Could not set the default CV.",
      "delete-failed": "Could not delete the CV.",
      "download-failed": "Could not create a download link.",
      "process-failed": "Could not start extraction.",
      "profile-save-failed": "Could not save the profile.",
      "profile-review-failed": "Could not mark the profile as reviewed.",
    };

    return {
      success: success ? (successMessages[success] ?? "Done.") : undefined,
      error: error
        ? (errorMessages[error] ?? detail ?? "Something went wrong.")
        : undefined,
    };
  });
}

export default async function CvLibraryPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireSessionOrRedirect();
  const [resumes, feedback] = await Promise.all([
    listResumes(user.id),
    getFeedback(searchParams),
  ]);

  const profiles = await Promise.all(
    resumes.map(async (resume) => ({
      resumeId: resume.id,
      profile: await getCandidateProfileForResume({
        userId: user.id,
        resumeId: resume.id,
      }),
    })),
  );

  const profileByResumeId = new Map(
    profiles.map((entry) => [entry.resumeId, entry.profile]),
  );

  return (
    <FadeIn className="space-y-8">
      <SettingsFeedbackToast
        success={feedback.success}
        error={feedback.error}
        clearPath="/cv-library"
      />

      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">CV Library</h1>
        <p className="text-muted-foreground max-w-3xl text-sm leading-6">
          Upload private CV files, extract text, review candidate facts, and
          choose a default version for outreach.
        </p>
      </div>

      <Card className="border-border/80 rounded-2xl shadow-none">
        <CardHeader>
          <CardTitle>Upload CV</CardTitle>
          <CardDescription>
            Files are validated, hashed, and stored through your active storage
            provider.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CvUploadForm />
        </CardContent>
      </Card>

      <Card className="border-border/80 rounded-2xl shadow-none">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Versions</CardTitle>
              <CardDescription>
                Rename, download, set default, delete, and review extracted
                profiles.
              </CardDescription>
            </div>
            <Badge
              variant="secondary"
              className="rounded-full px-3 py-1 text-xs"
            >
              {resumes.length} {resumes.length === 1 ? "file" : "files"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {resumes.length === 0 ? (
            <EmptyState
              title="No CVs yet"
              description="Upload a PDF or DOCX to create your first private CV record."
              className="border-border/80 bg-background/70 rounded-2xl px-6 py-8 shadow-none"
            />
          ) : (
            resumes.map((resume) => {
              const profile = profileByResumeId.get(resume.id);

              return (
                <div
                  key={resume.id}
                  className="border-border/80 bg-background/70 space-y-4 rounded-2xl border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium">{resume.name}</p>
                      <p className="text-muted-foreground truncate text-sm">
                        {resume.originalFileName}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge
                          variant="secondary"
                          className="rounded-full px-2.5 py-0.5 text-xs"
                        >
                          {formatBytes(resume.sizeBytes)}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="rounded-full px-2.5 py-0.5 text-xs"
                        >
                          {resume.storageProvider}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {resume.isDefault ? (
                        <Badge className="rounded-full px-3 py-1 text-xs">
                          Default
                        </Badge>
                      ) : null}
                      <Badge
                        variant="secondary"
                        className="rounded-full px-3 py-1 text-xs"
                      >
                        {resume.extractionStatus}
                      </Badge>
                    </div>
                  </div>

                  {resume.extractionError ? (
                    <p className="text-destructive text-sm">
                      {resume.extractionError}
                    </p>
                  ) : null}

                  <ResumeActions
                    resumeId={resume.id}
                    name={resume.name}
                    isDefault={resume.isDefault}
                    extractionStatus={resume.extractionStatus}
                    storageProvider={resume.storageProvider}
                  />

                  {profile ? (
                    <CandidateProfileEditor
                      resumeId={resume.id}
                      profile={{
                        headline: profile.headline,
                        summary: profile.summary,
                        contact: profile.contact,
                        skills: profile.skills as Array<{
                          name: string;
                          evidence?: { source: string; excerpt?: string };
                        }>,
                        experience: (profile.experience ?? []) as Array<{
                          title: string;
                          company: string;
                          startDate?: string;
                          endDate?: string;
                          bullets?: string[];
                          evidence?: { source: string; excerpt?: string };
                        }>,
                        education: (profile.education ?? []) as Array<{
                          school: string;
                          degree: string;
                          field?: string;
                          evidence?: { source: string; excerpt?: string };
                        }>,
                        projects: (profile.projects ?? []) as Array<{
                          name: string;
                          description?: string;
                          evidence?: { source: string; excerpt?: string };
                        }>,
                        achievements: (profile.achievements ?? []) as Array<{
                          text: string;
                          evidence?: { source: string; excerpt?: string };
                        }>,
                        reviewStatus: profile.reviewStatus,
                      }}
                    />
                  ) : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </FadeIn>
  );
}
