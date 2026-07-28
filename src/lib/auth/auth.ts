import "server-only";

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";

import { getAuthDb, getMongoClient } from "@/lib/db/mongodb";
import { getServerEnv } from "@/lib/env/server";

export type CreateAuthOptions = {
  /**
   * When true, email/password sign-up is allowed.
   * Used only by the owner bootstrap script when zero users exist.
   * Runtime application auth always keeps this false.
   */
  allowSignUp?: boolean;
};

async function buildAuth(options: CreateAuthOptions = {}) {
  const env = getServerEnv();
  const client = await getMongoClient();
  const db = await getAuthDb();

  return betterAuth({
    appName: "Job Hunt Workspace",
    baseURL: env.NEXT_PUBLIC_APP_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: mongodbAdapter(db, {
      client,
      // Standalone local MongoDB may not support transactions.
      transaction: false,
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !options.allowSignUp,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 20,
      customRules: {
        "/sign-in/email": {
          window: 60,
          max: 5,
        },
      },
    },
    trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
    plugins: [nextCookies()],
  });
}

type AuthInstance = Awaited<ReturnType<typeof buildAuth>>;

const globalForAuth = globalThis as typeof globalThis & {
  __jobHuntAuth?: AuthInstance;
  __jobHuntAuthPromise?: Promise<AuthInstance>;
};

/**
 * Runtime auth instance with public signup disabled.
 */
export async function getAuth(): Promise<AuthInstance> {
  if (globalForAuth.__jobHuntAuth) {
    return globalForAuth.__jobHuntAuth;
  }

  if (!globalForAuth.__jobHuntAuthPromise) {
    globalForAuth.__jobHuntAuthPromise = buildAuth({ allowSignUp: false }).then(
      (instance) => {
        globalForAuth.__jobHuntAuth = instance;
        return instance;
      },
    );
  }

  return globalForAuth.__jobHuntAuthPromise;
}

/**
 * Bootstrap-only auth that can create the first owner account.
 */
export async function createBootstrapAuth(): Promise<AuthInstance> {
  return buildAuth({ allowSignUp: true });
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};
