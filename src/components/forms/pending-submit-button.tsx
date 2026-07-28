"use client";

import type { ComponentProps } from "react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PendingSubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
  className?: string;
  variant?: ComponentProps<typeof Button>["variant"];
};

export function PendingSubmitButton({
  idleLabel,
  pendingLabel,
  className,
  variant = "default",
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending}
      className={cn("h-9 rounded-xl px-4 text-sm font-medium", className)}
    >
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        idleLabel
      )}
    </Button>
  );
}
