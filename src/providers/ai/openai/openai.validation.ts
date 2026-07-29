import { z } from "zod";

export const openaiCredentialsSchema = z.object({
  apiKey: z
    .string()
    .trim()
    .min(20, "OpenAI API key is required")
    .max(200)
    .regex(/^sk-/, "OpenAI API key should start with sk-"),
});

export type OpenAiCredentials = z.infer<typeof openaiCredentialsSchema>;

export function maskOpenAiKey(apiKey: string): string {
  if (apiKey.length < 10) return "sk-****";
  return `${apiKey.slice(0, 7)}…${apiKey.slice(-4)}`;
}
