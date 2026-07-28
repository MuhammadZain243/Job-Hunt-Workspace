import type { Metadata } from "next";
import { Cloud, DatabaseZap, HardDrive, ShieldCheck } from "lucide-react";

import { RequiredLabel } from "@/components/forms/required-label";
import { FadeIn } from "@/components/motion/fade-in";
import { DisconnectCloudinaryButton } from "@/components/settings/disconnect-cloudinary-button";
import { SettingsFeedbackToast } from "@/components/settings/settings-feedback-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireSessionOrRedirect } from "@/lib/auth/session";
import { getStorageSettingsView } from "@/modules/settings/settings.service";
import type { CvStorageProviderName } from "@/providers/storage/storage.types";

import {
  saveCloudinaryConnectionAction,
  testLocalStorageAction,
  updateStorageProviderAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Settings",
};

function getFeedback(
  searchParams:
    | Promise<Record<string, string | string[] | undefined>>
    | undefined,
): Promise<{ success?: string; error?: string }> {
  return Promise.resolve(searchParams).then((params) => {
    const getValue = (key: string) => {
      const value = params?.[key];
      return Array.isArray(value) ? value[0] : value;
    };

    const storageSuccess = getValue("storageSuccess");
    const storageError = getValue("storageError");
    const cloudinarySuccess = getValue("cloudinarySuccess");
    const cloudinaryError = getValue("cloudinaryError");
    const localStatus = getValue("localStatus");
    const disconnectSuccess = getValue("disconnectSuccess");
    const disconnectError = getValue("disconnectError");

    if (storageSuccess) {
      return { success: `Active provider saved: ${storageSuccess}.` };
    }
    if (storageError === "s3-pending") {
      return {
        error: "S3 settings are planned next. Use local or Cloudinary for now.",
      };
    }
    if (storageError === "invalid-provider") {
      return { error: "Choose a valid storage provider." };
    }
    if (cloudinarySuccess) {
      return {
        success: "Cloudinary connected and set as the active storage provider.",
      };
    }
    if (cloudinaryError === "invalid-credentials") {
      return { error: "Cloudinary credentials are incomplete." };
    }
    if (cloudinaryError === "connection-failed") {
      return {
        error: "Cloudinary connection failed. Check the credentials and try again.",
      };
    }
    if (localStatus) {
      return { success: localStatus };
    }
    if (disconnectSuccess === "cloudinary") {
      return {
        success:
          "Cloudinary disconnected and configuration removed. Active provider is local if needed.",
      };
    }
    if (disconnectError === "cloudinary") {
      return { error: "Could not disconnect Cloudinary. Try again." };
    }

    return {};
  });
}

function ProviderOption({
  activeProvider,
  provider,
  title,
  detail,
  icon: Icon,
}: {
  activeProvider: CvStorageProviderName;
  provider: "local" | "cloudinary" | "s3";
  title: string;
  detail: string;
  icon: typeof HardDrive;
}) {
  return (
    <label className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-border/80 bg-background/80 p-4 shadow-sm transition-colors hover:bg-muted/40">
      <div className="flex items-center justify-between gap-3">
        <Icon className="size-5 text-foreground" />
        <input
          type="radio"
          name="provider"
          value={provider}
          defaultChecked={activeProvider === provider}
          className="size-4"
        />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
    </label>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireSessionOrRedirect();
  const [settings, feedback] = await Promise.all([
    getStorageSettingsView(user.id),
    getFeedback(searchParams),
  ]);
  const cloudinaryConnection =
    settings.connections.find(
      (connection) => connection.provider === "cloudinary",
    ) ?? null;
  const isCloudinaryConnected = cloudinaryConnection?.status === "connected";

  return (
    <FadeIn className="space-y-8">
      <SettingsFeedbackToast
        success={feedback.success}
        error={feedback.error}
      />

      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Phase 1 starts with CV storage controls. Choose an active storage
          provider, connect Cloudinary securely, and verify the local
          development path.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Storage provider</CardTitle>
                <CardDescription>
                  Select where private CV files will live in Phase 1.
                </CardDescription>
              </div>
              <Badge
                variant="secondary"
                className="rounded-full px-3 py-1 text-xs"
              >
                Active: {settings.activeProvider}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <form action={updateStorageProviderAction} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <ProviderOption
                  activeProvider={settings.activeProvider}
                  provider="local"
                  title="Local"
                  detail="Best for local development and tests."
                  icon={HardDrive}
                />
                <ProviderOption
                  activeProvider={settings.activeProvider}
                  provider="cloudinary"
                  title="Cloudinary"
                  detail="Preferred hosted option for this project."
                  icon={Cloud}
                />
                <ProviderOption
                  activeProvider={settings.activeProvider}
                  provider="s3"
                  title="S3-compatible"
                  detail="Planned next for user-managed buckets."
                  icon={DatabaseZap}
                />
              </div>

              <Button type="submit" className="rounded-xl">
                Save active provider
              </Button>
            </form>

            <div className="rounded-2xl border border-border/80 bg-muted/25 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 text-foreground" />
                <p className="text-sm leading-6 text-muted-foreground">
                  Provider secrets stay server-side and are encrypted in
                  MongoDB. The browser only sees masked labels and connection
                  state.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="rounded-2xl border-border/80 shadow-none">
            <CardHeader>
              <CardTitle>Cloudinary connection</CardTitle>
              <CardDescription>
                Save and test Cloudinary credentials for protected CV storage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCloudinaryConnected ? (
                <div className="space-y-4 rounded-2xl border border-border/80 bg-background/70 p-4 text-sm">
                  <div>
                    <p className="font-medium">Connected account</p>
                    <p className="mt-1 text-muted-foreground">
                      {cloudinaryConnection.accountLabel}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Status: {cloudinaryConnection.status}
                      {cloudinaryConnection.lastCheckedAt
                        ? ` · checked ${new Date(cloudinaryConnection.lastCheckedAt).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Disconnecting revokes stored credentials and removes this
                    configuration. You can reconnect later with new details.
                  </p>
                  <DisconnectCloudinaryButton />
                </div>
              ) : null}

              <form
                action={saveCloudinaryConnectionAction}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <RequiredLabel htmlFor="cloudName" required>
                    Cloud name
                  </RequiredLabel>
                  <Input
                    id="cloudName"
                    name="cloudName"
                    required
                    aria-required="true"
                    placeholder="your-cloud-name"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="apiKey" required>
                    API key
                  </RequiredLabel>
                  <Input
                    id="apiKey"
                    name="apiKey"
                    required
                    aria-required="true"
                    placeholder="Cloudinary API key"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="apiSecret" required>
                    API secret
                  </RequiredLabel>
                  <Input
                    id="apiSecret"
                    name="apiSecret"
                    type="password"
                    required
                    aria-required="true"
                    placeholder="Cloudinary API secret"
                    className="h-11 rounded-xl"
                  />
                </div>
                <Button type="submit" className="rounded-xl">
                  {isCloudinaryConnected
                    ? "Update and test Cloudinary"
                    : "Save and test Cloudinary"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/80 shadow-none">
            <CardHeader>
              <CardTitle>Local storage check</CardTitle>
              <CardDescription>
                Verify that the development-only private upload path is ready.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={testLocalStorageAction}>
                <Button
                  type="submit"
                  variant="outline"
                  className="rounded-xl"
                >
                  Test local storage
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </FadeIn>
  );
}
