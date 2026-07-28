"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error.message);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <div className="w-full max-w-lg space-y-4">
          <ErrorState
            title="Application error"
            description="An unexpected error occurred. Try reloading the page."
            onRetry={reset}
          />
          <Button type="button" variant="outline" onClick={() => reset()}>
            Reload
          </Button>
        </div>
      </body>
    </html>
  );
}
