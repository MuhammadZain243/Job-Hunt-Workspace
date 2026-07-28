/**
 * Public, browser-safe environment values only.
 * Never import server secrets or `server-only` modules here.
 */
export const clientEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
