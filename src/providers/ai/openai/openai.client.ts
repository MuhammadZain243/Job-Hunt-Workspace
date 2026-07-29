import "server-only";

import OpenAI from "openai";

import {
  ProviderAuthError,
  ProviderUnavailableError,
} from "@/lib/errors/app-error";
import type { OpenAiCredentials } from "@/providers/ai/openai/openai.validation";

export const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

export function createOpenAiClient(credentials: OpenAiCredentials) {
  return new OpenAI({
    apiKey: credentials.apiKey,
    timeout: 45_000,
    maxRetries: 1,
  });
}

export async function testOpenAiConnection(
  credentials: OpenAiCredentials,
): Promise<{ ok: true; label: string }> {
  try {
    const client = createOpenAiClient(credentials);
    const models = await client.models.list();
    const first = models.data[0]?.id ?? "connected";
    return {
      ok: true,
      label: `OpenAI reachable (${first})`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (/incorrect api key|invalid.*key|401|unauthorized/i.test(message)) {
      throw new ProviderAuthError("OpenAI API key was rejected");
    }
    throw new ProviderUnavailableError(
      "OpenAI connection failed. Check the API key and try again.",
    );
  }
}

export async function createStructuredResponse<T>(input: {
  credentials: OpenAiCredentials;
  model?: string;
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<{
  parsed: T;
  rawText: string;
  model: string;
  tokenUsage: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
  };
}> {
  const client = createOpenAiClient(input.credentials);
  const model = input.model ?? DEFAULT_OPENAI_MODEL;

  try {
    const response = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: input.system }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: input.user }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: input.schemaName,
          strict: true,
          schema: input.schema,
        },
      },
    });

    const rawText = response.output_text?.trim() ?? "";
    if (!rawText) {
      throw new ProviderUnavailableError("OpenAI returned an empty response");
    }

    const parsed = JSON.parse(rawText) as T;
    return {
      parsed,
      rawText,
      model: response.model ?? model,
      tokenUsage: {
        inputTokens: response.usage?.input_tokens ?? null,
        outputTokens: response.usage?.output_tokens ?? null,
        totalTokens: response.usage?.total_tokens ?? null,
      },
    };
  } catch (error) {
    if (
      error instanceof ProviderUnavailableError ||
      error instanceof ProviderAuthError
    ) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    if (/incorrect api key|invalid.*key|401|unauthorized/i.test(message)) {
      throw new ProviderAuthError("OpenAI API key was rejected");
    }
    throw new ProviderUnavailableError(
      "OpenAI generation failed. Try again in a moment.",
    );
  }
}
