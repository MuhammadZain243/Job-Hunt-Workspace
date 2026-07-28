"use client";

import { useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import {
  deleteResumeAction,
  downloadResumeAction,
  renameResumeAction,
  reprocessResumeAction,
  setDefaultResumeAction,
} from "@/app/(workspace)/cv-library/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ResumeActionsProps = {
  resumeId: string;
  name: string;
  isDefault: boolean;
  extractionStatus: string;
};

export function ResumeActions({
  resumeId,
  name,
  isDefault,
  extractionStatus,
}: ResumeActionsProps) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <form
        action={(formData) => {
          startTransition(async () => {
            await renameResumeAction(formData);
          });
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <input type="hidden" name="resumeId" value={resumeId} />
        <div className="min-w-48 flex-1 space-y-1">
          <label htmlFor={`rename-${resumeId}`} className="text-xs text-muted-foreground">
            Rename
          </label>
          <Input
            id={`rename-${resumeId}`}
            name="name"
            defaultValue={name}
            className="h-9 rounded-xl"
            disabled={pending}
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          className="h-9 rounded-xl px-3 text-sm"
          disabled={pending}
        >
          Save name
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {!isDefault ? (
          <form
            action={(formData) => {
              startTransition(async () => {
                await setDefaultResumeAction(formData);
              });
            }}
          >
            <input type="hidden" name="resumeId" value={resumeId} />
            <Button
              type="submit"
              variant="outline"
              className="h-9 rounded-xl px-3 text-sm"
              disabled={pending}
            >
              Set default
            </Button>
          </form>
        ) : null}

        <form
          action={(formData) => {
            startTransition(async () => {
              await downloadResumeAction(formData);
            });
          }}
        >
          <input type="hidden" name="resumeId" value={resumeId} />
          <Button
            type="submit"
            variant="outline"
            className="h-9 rounded-xl px-3 text-sm"
            disabled={pending}
          >
            Download
          </Button>
        </form>

        {extractionStatus === "failed" || extractionStatus === "pending" ? (
          <form
            action={(formData) => {
              startTransition(async () => {
                await reprocessResumeAction(formData);
              });
            }}
          >
            <input type="hidden" name="resumeId" value={resumeId} />
            <Button
              type="submit"
              variant="outline"
              className="h-9 rounded-xl px-3 text-sm"
              disabled={pending}
            >
              {pending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Processing…
                </>
              ) : (
                "Reprocess"
              )}
            </Button>
          </form>
        ) : null}

        <form
          action={(formData) => {
            startTransition(async () => {
              await deleteResumeAction(formData);
            });
          }}
        >
          <input type="hidden" name="resumeId" value={resumeId} />
          <Button
            type="submit"
            variant="destructive"
            className="h-9 rounded-xl px-3 text-sm"
            disabled={pending}
          >
            Delete
          </Button>
        </form>
      </div>
    </div>
  );
}
