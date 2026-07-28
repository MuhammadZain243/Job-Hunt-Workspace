import "server-only";

import pino, { type Logger } from "pino";

const REDACT_PATHS = [
  "password",
  "authorization",
  "cookie",
  "token",
  "apiKey",
  "ciphertext",
  "refreshToken",
  "accessToken",
  "*.password",
  "*.authorization",
  "*.cookie",
  "*.token",
  "*.apiKey",
  "*.ciphertext",
  "*.refreshToken",
  "*.accessToken",
  "req.headers.authorization",
  "req.headers.cookie",
] as const;

function resolveLogLevel(): string {
  const fromEnv = process.env.LOG_LEVEL;
  if (
    fromEnv === "fatal" ||
    fromEnv === "error" ||
    fromEnv === "warn" ||
    fromEnv === "info" ||
    fromEnv === "debug" ||
    fromEnv === "trace"
  ) {
    return fromEnv;
  }
  return "info";
}

function createBaseLogger(): Logger {
  const level = resolveLogLevel();
  const isProduction = process.env.NODE_ENV === "production";

  // Prefer plain pino in production and when transport setup is awkward in Next.
  if (isProduction) {
    return pino({
      level,
      redact: {
        paths: [...REDACT_PATHS],
        censor: "[Redacted]",
      },
    });
  }

  try {
    return pino({
      level,
      redact: {
        paths: [...REDACT_PATHS],
        censor: "[Redacted]",
      },
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
    });
  } catch {
    return pino({
      level,
      redact: {
        paths: [...REDACT_PATHS],
        censor: "[Redacted]",
      },
    });
  }
}

export const logger: Logger = createBaseLogger();

/**
 * Child logger bound to a request correlation id.
 */
export function createRequestLogger(requestId: string): Logger {
  return logger.child({ requestId });
}
