/**
 * Bootstrap the single owner account.
 *
 * Usage:
 *   pnpm bootstrap:owner -- --email owner@example.com --password "a-strong-password" --name "Owner"
 *
 * Requirements:
 * - MongoDB reachable via MONGODB_URI
 * - Valid .env.local platform secrets
 * - Zero existing users in the Better Auth user collection
 */

import { createBootstrapAuth } from "../src/lib/auth/auth";
import { getAuthDb, getMongoClient } from "../src/lib/db/mongodb";
import { connectMongoose } from "../src/lib/db/mongoose";
import { ensurePhase0Indexes } from "../src/lib/db/indexes";
import { parseServerEnv } from "../src/lib/env/server";
import { AppSettingsModel } from "../src/modules/settings/settings.model";
import { recordAuditEvent } from "../src/modules/audit/audit.service";

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
}

async function main() {
  parseServerEnv();

  const email = readArg("--email");
  const password = readArg("--password");
  const name = readArg("--name") ?? "Owner";

  if (!email || !password) {
    throw new Error(
      'Usage: pnpm bootstrap:owner -- --email "you@example.com" --password "at-least-12-chars" [--name "Your Name"]',
    );
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const client = await getMongoClient();
  const db = await getAuthDb();
  const userCount = await db.collection("user").countDocuments();

  if (userCount > 0) {
    throw new Error(
      "An owner account already exists. Public signup remains disabled.",
    );
  }

  const auth = await createBootstrapAuth();
  const result = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name,
    },
  });

  if (!result?.user?.id) {
    throw new Error("Owner bootstrap failed: no user returned.");
  }

  await connectMongoose();
  await ensurePhase0Indexes();
  await AppSettingsModel.create({
    userId: result.user.id,
  });

  await recordAuditEvent({
    userId: result.user.id,
    action: "owner.bootstrap",
    entityType: "user",
    entityId: result.user.id,
    metadata: { emailDomain: email.split("@")[1] ?? "unknown" },
  });

  console.log("Owner account created successfully.");
  console.log(`Email: ${email}`);
  console.log("Public registration remains disabled.");

  await client.close();
  process.exit(0);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Bootstrap failed: ${message}`);
  process.exit(1);
});
