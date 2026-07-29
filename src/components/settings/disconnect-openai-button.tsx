"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import { disconnectOpenAiAction } from "@/app/(workspace)/settings/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DisconnectOpenAiButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await disconnectOpenAiAction();
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
              Disconnect OpenAI?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm leading-6">
              This permanently deletes the encrypted OpenAI API key from the
              database. Draft generation will stop until you reconnect.
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
              className="bg-destructive hover:bg-destructive/90 h-9 rounded-xl px-4 text-sm font-medium text-white"
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
