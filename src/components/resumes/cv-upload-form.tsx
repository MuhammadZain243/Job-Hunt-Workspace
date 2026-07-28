"use client";

import { useRef, useState } from "react";
import { LoaderCircle, Upload } from "lucide-react";

import { uploadResumeAction } from "@/app/(workspace)/cv-library/actions";
import { RequiredLabel } from "@/components/forms/required-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CvUploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        setPending(true);
        try {
          await uploadResumeAction(formData);
        } finally {
          setPending(false);
        }
      }}
      className="space-y-4"
    >
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
        <Input
          id="cv-file"
          name="file"
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          required
          disabled={pending}
          className="h-10 rounded-xl file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm"
          onChange={(event) => {
            setFileName(event.target.files?.[0]?.name ?? null);
          }}
        />
        <p className="text-xs text-muted-foreground">
          PDF or DOCX only, up to 8 MB.
          {fileName ? ` Selected: ${fileName}` : ""}
        </p>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="h-9 rounded-xl px-4 text-sm font-medium"
      >
        {pending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Uploading…
          </>
        ) : (
          <>
            <Upload className="size-4" />
            Upload CV
          </>
        )}
      </Button>
    </form>
  );
}
