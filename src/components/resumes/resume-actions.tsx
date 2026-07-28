"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import {
  deleteResumeAction,
  downloadResumeAction,
  renameResumeAction,
  reprocessResumeAction,
  setDefaultResumeAction,
} from "@/app/(workspace)/cv-library/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type ResumeActionsProps = {
  resumeId: string;
  name: string;
  isDefault: boolean;
  extractionStatus: string;
  storageProvider: string;
};

export function ResumeActions({
  resumeId,
  name,
  isDefault,
  extractionStatus,
  storageProvider,
}: ResumeActionsProps) {
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

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
          <label
            htmlFor={`rename-${resumeId}`}
            className="text-xs text-muted-foreground"
          >
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

        {extractionStatus === "failed" ||
        extractionStatus === "pending" ||
        extractionStatus === "processing" ? (
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

        <Button
          type="button"
          variant="destructive"
          className="h-9 rounded-xl px-3 text-sm"
          disabled={pending}
          onClick={() => setDeleteOpen(true)}
        >
          Delete
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent
          showCloseButton={false}
          className="gap-0 overflow-hidden rounded-2xl border border-border bg-background p-0 sm:max-w-md"
        >
          <DialogHeader className="gap-2 px-6 pt-6 pb-4">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Delete this CV?
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-foreground">
              This permanently removes <span className="font-medium text-foreground">{name}</span> from
              the database and deletes the file from {storageProvider}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="m-0 flex-row justify-end gap-2 rounded-none border-t border-border bg-muted/40 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl px-4 text-sm"
              disabled={pending}
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-9 rounded-xl bg-destructive px-4 text-sm font-medium text-white hover:bg-destructive/90"
              disabled={pending}
              onClick={() => {
                const formData = new FormData();
                formData.set("resumeId", resumeId);
                startTransition(async () => {
                  await deleteResumeAction(formData);
                });
              }}
            >
              {pending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete permanently"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
