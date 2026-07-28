import type { Metadata } from "next";
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { redirectIfAuthenticated } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <div className="min-h-screen bg-[linear-gradient(165deg,oklch(0.985_0.008_95)_0%,oklch(0.97_0.012_230)_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(24rem,28rem)]">
        <section className="order-2 rounded-[28px] border border-white/60 bg-white/65 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:p-8 lg:order-1 lg:p-10">
          <div className="max-w-xl space-y-6">
            <div className="space-y-4">
              <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                Job Hunt Workspace
              </p>
              <div className="space-y-3">
                <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                  Calm, private control over your job search.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                  Sign in to your personal workspace for applications,
                  research, outreach drafts, and next steps. The experience
                  stays focused and owner-only.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <ShieldCheck className="mb-3 size-5 text-foreground" />
                <p className="text-sm font-medium">Private access</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  No public signup
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <Sparkles className="mb-3 size-5 text-foreground" />
                <p className="text-sm font-medium">Focused workspace</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Clean, calm layout
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <CheckCircle2 className="mb-3 size-5 text-foreground" />
                <p className="text-sm font-medium">Protected routes</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Auth-checked dashboard
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="order-1 lg:order-2">
          <Card className="rounded-[28px] border border-white/70 bg-white/88 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm">
            <CardHeader className="gap-3 px-6 pt-7 sm:px-7">
              <div className="space-y-2">
                <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                  Owner access
                </p>
                <CardTitle className="text-3xl font-semibold tracking-tight">
                  Sign in
                </CardTitle>
              </div>
              <CardDescription className="max-w-sm text-sm leading-6">
                Use the email and password created during bootstrap. Public
                registration is disabled.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-7 sm:px-7">
              <LoginForm />
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
