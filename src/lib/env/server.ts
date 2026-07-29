import "server-only";

import { z } from "zod";

const LOG_LEVELS = [
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
] as const;

const CV_STORAGE_PROVIDERS = ["local", "cloudinary", "s3"] as const;

/** Optional env values that may be omitted or left as empty string. */
const optionalEmptyOk = z.string().optional();

const encryptionMasterKeySchema = z
  .string()
  .min(1, "APP_ENCRYPTION_MASTER_KEY is required")
  .superRefine((value, ctx) => {
    let decoded: Buffer;
    try {
      decoded = Buffer.from(value, "base64");
    } catch {
      ctx.addIssue({
        code: "custom",
        message:
          "APP_ENCRYPTION_MASTER_KEY must be a valid base64-encoded 32-byte key",
      });
      return;
    }
    if (decoded.length !== 32) {
      ctx.addIssue({
        code: "custom",
        message: "APP_ENCRYPTION_MASTER_KEY must decode to exactly 32 bytes",
      });
    }
  });

export const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_DB_NAME: z.string().min(1, "MONGODB_DB_NAME is required"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  APP_ENCRYPTION_MASTER_KEY: encryptionMasterKeySchema,
  APP_ENCRYPTION_KEY_VERSION: z.coerce
    .number()
    .int()
    .positive("APP_ENCRYPTION_KEY_VERSION must be a positive integer")
    .default(1),
  CV_STORAGE_DEFAULT_PROVIDER: z.enum(CV_STORAGE_PROVIDERS).default("local"),
  LOCAL_PRIVATE_STORAGE_PATH: z
    .string()
    .min(1)
    .default(".data/private-uploads"),
  LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),

  INNGEST_EVENT_KEY: optionalEmptyOk,
  INNGEST_SIGNING_KEY: optionalEmptyOk,
  SENTRY_DSN: optionalEmptyOk,
  OBJECT_STORAGE_ENDPOINT: optionalEmptyOk,
  OBJECT_STORAGE_REGION: optionalEmptyOk,
  OBJECT_STORAGE_BUCKET: optionalEmptyOk,
  OBJECT_STORAGE_ACCESS_KEY_ID: optionalEmptyOk,
  OBJECT_STORAGE_SECRET_ACCESS_KEY: optionalEmptyOk,
  OBJECT_STORAGE_FORCE_PATH_STYLE: optionalEmptyOk,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const SAFE_FIELD_HINTS: Record<string, string> = {
  NODE_ENV: "Must be development, test, or production",
  NEXT_PUBLIC_APP_URL: "Must be a valid absolute URL",
  MONGODB_URI: "Must be a non-empty connection string",
  MONGODB_DB_NAME: "Must be a non-empty database name",
  BETTER_AUTH_SECRET: "Must be at least 32 characters",
  APP_ENCRYPTION_MASTER_KEY: "Must be base64 encoding of exactly 32 bytes",
  APP_ENCRYPTION_KEY_VERSION: "Must be a positive integer",
  CV_STORAGE_DEFAULT_PROVIDER: "Must be local, cloudinary, or s3",
  LOCAL_PRIVATE_STORAGE_PATH: "Must be a non-empty path",
  LOG_LEVEL: "Must be a valid log level",
};

function formatServerEnvError(error: z.ZodError): Error {
  const parts = error.issues.map((issue) => {
    const path = issue.path.join(".") || "env";
    const hint = SAFE_FIELD_HINTS[path];
    return hint ? `${path}: ${hint}` : `${path}: invalid`;
  });
  return new Error(
    `Invalid server environment configuration. ${parts.join("; ")}`,
  );
}

/**
 * Parse and validate server environment from an arbitrary ProcessEnv.
 * Safe for tests — does not cache. Never includes secret values in errors.
 */
export function parseServerEnv(
  env: NodeJS.ProcessEnv = process.env,
): ServerEnv {
  const result = serverEnvSchema.safeParse(env);
  if (!result.success) {
    throw formatServerEnvError(result.error);
  }
  return result.data;
}

let cachedServerEnv: ServerEnv | undefined;

/**
 * Lazily validates and caches `process.env`.
 */
export function getServerEnv(): ServerEnv {
  if (!cachedServerEnv) {
    cachedServerEnv = parseServerEnv(process.env);
  }
  return cachedServerEnv;
}

export function resetServerEnvCache(): void {
  cachedServerEnv = undefined;
}

/**
 * Returns whether the given env passes validation without throwing.
 */
export function isServerEnvConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return serverEnvSchema.safeParse(env).success;
}

/**
 * Lazy accessor so importing this module does not force validation until use.
 * Prefer `getServerEnv()` in application code.
 */
export const serverEnv: ServerEnv = new Proxy({} as ServerEnv, {
  get(_target, property, receiver) {
    return Reflect.get(getServerEnv(), property, receiver);
  },
  ownKeys() {
    return Reflect.ownKeys(getServerEnv());
  },
  getOwnPropertyDescriptor(_target, property) {
    return Object.getOwnPropertyDescriptor(getServerEnv(), property);
  },
  has(_target, property) {
    return property in getServerEnv();
  },
});
