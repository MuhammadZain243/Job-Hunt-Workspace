import type { Metadata } from "next";

import { FadeIn } from "@/components/motion/fade-in";
import { EmptyState } from "@/components/states/empty-state";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <FadeIn className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Account, integrations, and provider credentials will be configured
          here in later phases.
        </p>
      </div>

      <EmptyState
        title="Settings coming soon"
        description="Phase 0 establishes the protected settings route. Gmail, OpenAI, Cloudinary, and storage connections are intentionally not implemented yet."
      />
    </FadeIn>
  );
}
