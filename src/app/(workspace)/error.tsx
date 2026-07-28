"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/states/error-state";

export default function WorkspaceError({
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
    <ErrorState
      title="Workspace error"
      description="The page could not be loaded. Your session is still protected."
      onRetry={reset}
    />
  );
}
