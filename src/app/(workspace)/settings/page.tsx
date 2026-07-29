import type { Metadata } from "next";
import { Cloud, DatabaseZap, HardDrive, ShieldCheck } from "lucide-react";

import { RequiredLabel } from "@/components/forms/required-label";
import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
import { FadeIn } from "@/components/motion/fade-in";
import { DisconnectCloudinaryButton } from "@/components/settings/disconnect-cloudinary-button";
import { DisconnectS3Button } from "@/components/settings/disconnect-s3-button";
import { SettingsFeedbackToast } from "@/components/settings/settings-feedback-toast";
import { Badge } from "@/components/ui/badge";
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
  saveS3ConnectionAction,
  testLocalStorageAction,
  updateStorageProviderAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Settings",
};

function getFeedback(
  searchParams:
    Promise<Record<string, string | string[] | undefined>> | undefined,
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
    const s3Success = getValue("s3Success");
    const s3Error = getValue("s3Error");
    const localStatus = getValue("localStatus");
    const disconnectSuccess = getValue("disconnectSuccess");
    const disconnectError = getValue("disconnectError");

    if (storageSuccess) {
      return { success: `Active provider saved: ${storageSuccess}.` };
    }
    if (storageError === "local-production") {
      return {
        error: "Local storage cannot be used in production.",
      };
    }
    if (storageError === "not-connected") {
      return {
        error: "Connect the provider before setting it as active.",
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
        error:
          "Cloudinary connection failed. Check the credentials and try again.",
      };
    }
    if (s3Success) {
      return {
        success: "S3 connected and set as the active storage provider.",
      };
    }
    if (s3Error === "invalid-credentials") {
      return { error: "S3 credentials are incomplete." };
    }
    if (s3Error === "connection-failed") {
      return {
        error: "S3 connection failed. Check the credentials and try again.",
      };
    }
    if (localStatus) {
      return { success: localStatus };
    }
    if (disconnectSuccess === "cloudinary") {
      return {
        success:
          "Cloudinary disconnected. Configuration deleted from the database.",
      };
    }
    if (disconnectSuccess === "s3") {
      return {
        success: "S3 disconnected. Configuration deleted from the database.",
      };
    }
    if (disconnectError === "cloudinary") {
      return { error: "Could not disconnect Cloudinary. Try again." };
    }
    if (disconnectError === "s3") {
      return { error: "Could not disconnect S3. Try again." };
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
  disabled = false,
}: {
  activeProvider: CvStorageProviderName;
  provider: "local" | "cloudinary" | "s3";
  title: string;
  detail: string;
  icon: typeof HardDrive;
  disabled?: boolean;
}) {
  return (
    <label
      className={`border-border/80 bg-background/80 flex flex-col gap-3 rounded-2xl border p-4 shadow-sm transition-colors ${
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:bg-muted/40 cursor-pointer"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <Icon className="text-foreground size-5" />
        <input
          type="radio"
          name="provider"
          value={provider}
          defaultChecked={activeProvider === provider}
          disabled={disabled}
          className="size-4"
        />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted-foreground mt-1 text-sm leading-6">{detail}</p>
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
  const s3Connection =
    settings.connections.find((connection) => connection.provider === "s3") ??
    null;
  const isCloudinaryConnected = cloudinaryConnection?.status === "connected";
  const isS3Connected = s3Connection?.status === "connected";

  return (
    <FadeIn className="space-y-8">
      <SettingsFeedbackToast
        success={feedback.success}
        error={feedback.error}
        clearPath="/settings"
      />

      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground max-w-3xl text-sm leading-6">
          Manage CV storage. Choose an active provider, connect Cloudinary or S3
          securely, and verify the local development path when available.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <Card className="border-border/80 rounded-2xl shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Storage provider</CardTitle>
                <CardDescription>
                  Select where private CV files will be stored.
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
                  detail={
                    settings.isProduction
                      ? "Disabled in production."
                      : "Best for local development and tests."
                  }
                  icon={HardDrive}
                  disabled={settings.isProduction}
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
                  detail="Private bucket with short-lived signed access."
                  icon={DatabaseZap}
                />
              </div>

              <PendingSubmitButton
                idleLabel="Save active provider"
                pendingLabel="Saving…"
              />
            </form>

            {settings.resumeCount > 0 ? (
              <div className="border-border/80 bg-muted/25 rounded-2xl border p-4">
                <p className="text-muted-foreground text-sm leading-6">
                  You already have {settings.resumeCount} CV
                  {settings.resumeCount === 1 ? "" : "s"} stored. Changing the
                  active provider affects new uploads only. Existing files keep
                  their original provider until you re-upload or migrate them.
                </p>
              </div>
            ) : null}

            <div className="border-border/80 bg-muted/25 rounded-2xl border p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="text-foreground mt-0.5 size-4" />
                <p className="text-muted-foreground text-sm leading-6">
                  Provider secrets stay server-side and are encrypted in
                  MongoDB. The browser only sees masked labels and connection
                  state.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border-border/80 rounded-2xl shadow-none">
            <CardHeader>
              <CardTitle>Cloudinary connection</CardTitle>
              <CardDescription>
                Save and test Cloudinary credentials for protected CV storage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCloudinaryConnected ? (
                <div className="border-border/80 bg-background/70 space-y-4 rounded-2xl border p-4 text-sm">
                  <div>
                    <p className="font-medium">Connected account</p>
                    <p className="text-muted-foreground mt-1">
                      {cloudinaryConnection.accountLabel}
                    </p>
                    <p className="text-muted-foreground mt-1">
                      Status: {cloudinaryConnection.status}
                      {cloudinaryConnection.lastCheckedAt
                        ? ` · checked ${new Date(cloudinaryConnection.lastCheckedAt).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
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
                    className="h-10 rounded-xl"
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
                    className="h-10 rounded-xl"
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
                    className="h-10 rounded-xl"
                  />
                </div>
                <PendingSubmitButton
                  idleLabel={
                    isCloudinaryConnected
                      ? "Update and test Cloudinary"
                      : "Save and test Cloudinary"
                  }
                  pendingLabel="Testing connection…"
                />
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/80 rounded-2xl shadow-none">
            <CardHeader>
              <CardTitle>S3-compatible connection</CardTitle>
              <CardDescription>
                Connect a private bucket for CV storage with encrypted
                credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isS3Connected ? (
                <div className="border-border/80 bg-background/70 space-y-4 rounded-2xl border p-4 text-sm">
                  <div>
                    <p className="font-medium">Connected bucket</p>
                    <p className="text-muted-foreground mt-1">
                      {s3Connection.accountLabel}
                    </p>
                    <p className="text-muted-foreground mt-1">
                      Status: {s3Connection.status}
                    </p>
                  </div>
                  <DisconnectS3Button />
                </div>
              ) : null}

              <form action={saveS3ConnectionAction} className="space-y-4">
                <div className="space-y-2">
                  <RequiredLabel htmlFor="endpoint">
                    Endpoint (optional)
                  </RequiredLabel>
                  <Input
                    id="endpoint"
                    name="endpoint"
                    placeholder="https://s3.amazonaws.com"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <RequiredLabel htmlFor="region" required>
                      Region
                    </RequiredLabel>
                    <Input
                      id="region"
                      name="region"
                      required
                      placeholder="us-east-1"
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <RequiredLabel htmlFor="bucket" required>
                      Bucket
                    </RequiredLabel>
                    <Input
                      id="bucket"
                      name="bucket"
                      required
                      placeholder="job-hunt-cvs"
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="accessKeyId" required>
                    Access key ID
                  </RequiredLabel>
                  <Input
                    id="accessKeyId"
                    name="accessKeyId"
                    required
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="secretAccessKey" required>
                    Secret access key
                  </RequiredLabel>
                  <Input
                    id="secretAccessKey"
                    name="secretAccessKey"
                    type="password"
                    required
                    className="h-10 rounded-xl"
                  />
                </div>
                <label className="text-muted-foreground flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="forcePathStyle"
                    defaultChecked
                    className="size-4"
                  />
                  Force path-style URLs
                </label>
                <PendingSubmitButton
                  idleLabel={
                    isS3Connected ? "Update and test S3" : "Save and test S3"
                  }
                  pendingLabel="Testing connection…"
                />
              </form>
            </CardContent>
          </Card>

          {!settings.isProduction ? (
            <Card className="border-border/80 rounded-2xl shadow-none">
              <CardHeader>
                <CardTitle>Local storage check</CardTitle>
                <CardDescription>
                  Verify that the development-only private upload path is ready.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form action={testLocalStorageAction}>
                  <PendingSubmitButton
                    variant="outline"
                    idleLabel="Test local storage"
                    pendingLabel="Testing…"
                  />
                </form>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </FadeIn>
  );
}
