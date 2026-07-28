"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type SettingsFeedbackToastProps = {
  success?: string;
  error?: string;
};

export function SettingsFeedbackToast({
  success,
  error,
}: SettingsFeedbackToastProps) {
  const router = useRouter();
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

    router.replace("/settings");
  }, [success, error, router]);

  return null;
}
