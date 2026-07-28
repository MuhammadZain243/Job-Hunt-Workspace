import type { Metadata } from "next";
import { ArrowRight, LockKeyhole, Sparkles, Waypoints } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <FadeIn className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
            Phase 0 foundation
          </Badge>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Your protected workspace is ready. Companies, jobs, CV, and
              outreach tools will plug into this shell in the next phases.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-xl px-4 text-sm"
          disabled
        >
          Add job
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardContent className="space-y-3 px-5 py-5">
            <LockKeyhole className="size-5 text-foreground" />
            <div>
              <p className="text-sm font-medium">Authentication ready</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Owner-only access, protected routes, and sign-out are working.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardContent className="space-y-3 px-5 py-5">
            <Waypoints className="size-5 text-foreground" />
            <div>
              <p className="text-sm font-medium">Navigation foundation</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Future modules are visible now, so the product shape is clear
                from the start.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardContent className="space-y-3 px-5 py-5">
            <Sparkles className="size-5 text-foreground" />
            <div>
              <p className="text-sm font-medium">Next UX milestone</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Phase 1 will connect CV storage, review flows, and candidate
                profile setup.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <EmptyState
        title="No activity yet"
        description="Once you import jobs and start applications, next actions, status updates, and follow-ups will appear here in a tighter working view."
        className="rounded-2xl border-border/80 bg-background/70 px-6 py-8 shadow-none"
      />
    </FadeIn>
  );
}
