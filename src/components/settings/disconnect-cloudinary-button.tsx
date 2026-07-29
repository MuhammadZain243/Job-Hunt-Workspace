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
          className="border-border bg-background gap-0 overflow-hidden rounded-2xl border p-0 sm:max-w-md"
        >
          <DialogHeader className="gap-2 px-6 pt-6 pb-4">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Disconnect Cloudinary?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm leading-6">
              This permanently deletes the saved Cloudinary connection and
              encrypted credentials from the database. Existing CV files stay
              listed, but Cloudinary downloads will fail until you reconnect. If
              Cloudinary is the active provider, storage switches to local.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="border-border bg-muted/40 m-0 flex-row justify-end gap-2 rounded-none border-t px-6 py-4">
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
              className="bg-destructive hover:bg-destructive/90 focus-visible:border-destructive focus-visible:ring-destructive/30 h-9 rounded-xl px-4 text-sm font-medium text-white"
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
