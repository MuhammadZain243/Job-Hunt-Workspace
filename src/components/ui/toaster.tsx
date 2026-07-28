"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      richColors={false}
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border border-border bg-background text-foreground shadow-lg",
          title: "text-sm font-medium text-foreground",
          description: "text-sm text-muted-foreground",
          success: "border-border bg-background",
          error: "border-destructive/30 bg-background",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
          closeButton: "border-border bg-background text-muted-foreground",
        },
      }}
    />
  );
}
