import type { Metadata } from "next";
import { ArrowRight, LockKeyhole, Sparkles, Waypoints } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { EmptyState } from "@/components/states/empty-state";
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
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
              Your protected workspace is ready. Companies, jobs, CV, and
              outreach tools plug into this shell as you continue building.
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
        <Card className="border-border/80 rounded-2xl shadow-none">
          <CardContent className="space-y-3 px-5 py-5">
            <LockKeyhole className="text-foreground size-5" />
            <div>
              <p className="text-sm font-medium">Authentication ready</p>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                Owner-only access, protected routes, and sign-out are working.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 rounded-2xl shadow-none">
          <CardContent className="space-y-3 px-5 py-5">
            <Waypoints className="text-foreground size-5" />
            <div>
              <p className="text-sm font-medium">Navigation foundation</p>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                Future modules are visible now, so the product shape is clear
                from the start.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 rounded-2xl shadow-none">
          <CardContent className="space-y-3 px-5 py-5">
            <Sparkles className="text-foreground size-5" />
            <div>
              <p className="text-sm font-medium">Next UX milestone</p>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                CV storage, review flows, and candidate profile setup come next.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <EmptyState
        title="No activity yet"
        description="Once you import jobs and start applications, next actions, status updates, and follow-ups will appear here in a tighter working view."
        className="border-border/80 bg-background/70 rounded-2xl px-6 py-8 shadow-none"
      />
    </FadeIn>
  );
}
