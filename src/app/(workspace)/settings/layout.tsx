import type { Metadata } from "next";

import { SettingsSidebar } from "@/components/settings/settings-sidebar";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground max-w-3xl text-sm leading-6">
          Configure one area at a time. Provider secrets stay encrypted
          server-side.
        </p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <SettingsSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
