"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";

import { disconnectCloudinaryAction } from "@/app/(workspace)/settings/actions";

export function DisconnectCloudinaryButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      className="rounded-xl"
      disabled={pending}
      onClick={() => {
        const confirmed = window.confirm(
          "Disconnect Cloudinary and delete this configuration? If Cloudinary is the active provider, storage will switch to local.",
        );
        if (!confirmed) {
          return;
        }
        startTransition(async () => {
          await disconnectCloudinaryAction();
        });
      }}
    >
      {pending ? "Disconnecting…" : "Disconnect and delete"}
    </Button>
  );
}
