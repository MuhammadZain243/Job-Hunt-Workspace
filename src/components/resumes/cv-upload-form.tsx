"use client";

import { useEffect, useRef, useState } from "react";
import { FileUp, LoaderCircle, Upload } from "lucide-react";
import { useFormStatus } from "react-dom";

import { uploadResumeAction } from "@/app/(workspace)/cv-library/actions";
import { RequiredLabel } from "@/components/forms/required-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function CvUploadFields({
  file,
  onFileChange,
}: {
  file: File | null;
  onFileChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const wasPending = useRef(false);
  const { pending } = useFormStatus();

  useEffect(() => {
    if (wasPending.current && !pending) {
      onFileChange(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
    wasPending.current = pending;
  }, [pending, onFileChange]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <RequiredLabel htmlFor="cv-name">Display name</RequiredLabel>
          <Input
            id="cv-name"
            name="name"
            placeholder="Software Engineer CV"
            className="h-10 rounded-xl"
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <RequiredLabel htmlFor="cv-file" required>
            CV file
          </RequiredLabel>
          <input
            ref={inputRef}
            id="cv-file"
            name="file"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            required
            disabled={pending}
            className="sr-only"
            onChange={(event) => {
              onFileChange(event.target.files?.[0] ?? null);
            }}
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex h-10 w-full items-center gap-3 rounded-xl border border-dashed border-border bg-background px-3 text-left text-sm transition-colors hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            <FileUp className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {file ? file.name : "Choose PDF or DOCX"}
            </span>
            {file ? (
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatBytes(file.size)}
              </span>
            ) : null}
          </button>
          <p className="text-xs text-muted-foreground">
            PDF or DOCX only, up to 8 MB.
          </p>
        </div>
      </div>

      <Button
        type="submit"
        disabled={pending || !file}
        className="h-10 rounded-xl px-4 text-sm font-semibold shadow-sm"
      >
        {pending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="size-4" />
            Upload CV
          </>
        )}
      </Button>
    </>
  );
}

export function CvUploadForm() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <form action={uploadResumeAction} className="space-y-4">
      <CvUploadFields file={file} onFileChange={setFile} />
    </form>
  );
}
