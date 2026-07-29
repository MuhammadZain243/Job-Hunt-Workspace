import { getOpenAiSettingsFeedback } from "@/app/(workspace)/settings/feedback";
import { saveOpenAiConnectionAction } from "@/app/(workspace)/settings/actions";
import { PendingSubmitButton } from "@/components/forms/pending-submit-button";
import { RequiredLabel } from "@/components/forms/required-label";
import { FadeIn } from "@/components/motion/fade-in";
import { DisconnectOpenAiButton } from "@/components/settings/disconnect-openai-button";
import { SettingsFeedbackToast } from "@/components/settings/settings-feedback-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireSessionOrRedirect } from "@/lib/auth/session";
import { getOpenAiConnectionView } from "@/modules/ai/ai-generation.service";

export default async function OpenAiSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireSessionOrRedirect();
  const [openaiConnection, params] = await Promise.all([
    getOpenAiConnectionView(user.id),
    Promise.resolve(searchParams),
  ]);
  const feedback = getOpenAiSettingsFeedback(params);
  const isOpenAiConnected = openaiConnection?.status === "connected";

  return (
    <FadeIn className="space-y-5">
      <SettingsFeedbackToast
        success={feedback.success}
        error={feedback.error}
        clearPath="/settings/openai"
      />

      <div>
        <h2 className="text-xl font-semibold tracking-tight">OpenAI</h2>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          Connect an API key for job-match analysis and outreach drafts. Keys
          never return to the browser after save.
        </p>
      </div>

      <Card className="border-border/80 rounded-2xl shadow-none">
        <CardHeader>
          <CardTitle>API connection</CardTitle>
          <CardDescription>
            Encrypt and store an OpenAI API key for draft generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOpenAiConnected ? (
            <div className="border-border/80 bg-background/70 space-y-4 rounded-2xl border p-4 text-sm">
              <div>
                <p className="font-medium">Connected key</p>
                <p className="text-muted-foreground mt-1">
                  {openaiConnection?.accountLabel}
                </p>
              </div>
              <DisconnectOpenAiButton />
            </div>
          ) : null}
          <form action={saveOpenAiConnectionAction} className="space-y-4">
            <div className="space-y-2">
              <RequiredLabel htmlFor="openai-api-key" required>
                API key
              </RequiredLabel>
              <Input
                id="openai-api-key"
                name="apiKey"
                type="password"
                required
                className="h-10 rounded-xl"
                placeholder="sk-..."
                autoComplete="off"
              />
            </div>
            <PendingSubmitButton
              idleLabel={
                isOpenAiConnected
                  ? "Rotate and test OpenAI key"
                  : "Save and test OpenAI"
              }
              pendingLabel="Testing connection…"
            />
          </form>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
