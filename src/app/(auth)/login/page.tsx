import type { Metadata } from "next";

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
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(165deg,_oklch(0.985_0.008_95)_0%,_oklch(0.97_0.012_230)_100%)] px-4">
      <main className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Job Hunt Workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Private owner access only. Public registration is disabled.
          </p>
        </div>

        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Owner account</CardTitle>
            <CardDescription>
              Use the email and password created during bootstrap.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
