import { NextResponse } from "next/server";

import { checkDatabaseHealth } from "@/lib/db/health";
import { isServerEnvConfigured } from "@/lib/env/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const envOk = isServerEnvConfigured();
  const database = envOk
    ? await checkDatabaseHealth()
    : { ok: false, latencyMs: 0, errorCode: "ENV_INVALID" };

  const ok = envOk && database.ok;

  return NextResponse.json(
    {
      ok,
      checks: {
        env: envOk,
        database,
      },
    },
    { status: ok ? 200 : 503 },
  );
}
