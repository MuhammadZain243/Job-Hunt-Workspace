import "server-only";

import { getMongoClient } from "@/lib/db/mongodb";
import { getServerEnv } from "@/lib/env/server";

export type DatabaseHealthResult = {
  ok: boolean;
  latencyMs: number;
  errorCode?: string;
};

/**
 * Ping MongoDB and return latency. Never includes URI or credentials.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthResult> {
  const started = Date.now();

  try {
    const client = await getMongoClient();
    const { MONGODB_DB_NAME } = getServerEnv();
    await client.db(MONGODB_DB_NAME).command({ ping: 1 });
    return {
      ok: true,
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    const errorCode =
      error instanceof Error && "code" in error && error.code != null
        ? String(error.code)
        : error instanceof Error
          ? error.name
          : "UNKNOWN";

    return {
      ok: false,
      latencyMs: Date.now() - started,
      errorCode,
    };
  }
}
