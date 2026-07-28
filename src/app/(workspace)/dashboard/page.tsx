import type { Metadata } from "next";

import { FadeIn } from "@/components/motion/fade-in";
import { EmptyState } from "@/components/states/empty-state";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <FadeIn className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Foundation is ready. Job, CV, and outreach modules arrive in later
          phases.
        </p>
      </div>

      <EmptyState
        title="No activity yet"
        description="Once you import jobs and start applications, next actions and follow-ups will appear here."
      />
    </FadeIn>
  );
}
