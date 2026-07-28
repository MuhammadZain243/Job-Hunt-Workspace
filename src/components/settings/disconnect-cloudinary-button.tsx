"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import { disconnectCloudinaryAction } from "@/app/(workspace)/settings/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DisconnectCloudinaryButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await disconnectCloudinaryAction();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        className="h-9 rounded-xl px-4 text-sm font-medium"
        onClick={() => setOpen(true)}
      >
        Disconnect and delete
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="gap-0 overflow-hidden rounded-2xl border border-border bg-background p-0 sm:max-w-md"
        >
          <DialogHeader className="gap-2 px-6 pt-6 pb-4">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Disconnect Cloudinary?
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-foreground">
              This removes the saved Cloudinary configuration and revokes stored
              credentials. If Cloudinary is the active provider, storage will
              switch to local.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="m-0 flex-row justify-end gap-2 rounded-none border-t border-border bg-muted/40 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-9 min-w-24 rounded-xl px-4 text-sm font-medium"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-9 rounded-xl bg-destructive px-4 text-sm font-medium text-white hover:bg-destructive/90 focus-visible:border-destructive focus-visible:ring-destructive/30"
              disabled={pending}
              onClick={handleConfirm}
            >
              {pending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Disconnecting…
                </>
              ) : (
                "Disconnect and delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
