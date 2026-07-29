"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CopyTextButton({
  text,
  idleLabel = "Copy",
}: {
  text: string;
  idleLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      className="h-9 rounded-xl"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : idleLabel}
    </Button>
  );
}
