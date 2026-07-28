"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

type FeedbackToastProps = {
  success?: string;
  error?: string;
  clearPath?: string;
};

export function SettingsFeedbackToast({
  success,
  error,
  clearPath,
}: FeedbackToastProps) {
  const router = useRouter();
  const pathname = usePathname();
  const shownKey = useRef<string | null>(null);

  useEffect(() => {
    if (!success && !error) {
      return;
    }

    const key = `${success ?? ""}|${error ?? ""}`;
    if (shownKey.current === key) {
      return;
    }
    shownKey.current = key;

    if (success) {
      toast.success(success);
    }

    if (error) {
      toast.error(error);
    }

    router.replace(clearPath ?? pathname);
  }, [success, error, router, clearPath, pathname]);

  return null;
}
