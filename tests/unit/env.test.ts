import { afterEach, describe, expect, it } from "vitest";

import {
  isServerEnvConfigured,
  parseServerEnv,
  resetServerEnvCache,
} from "@/lib/env/server";

const VALID_KEY = Buffer.alloc(32, 3).toString("base64");

function baseEnv(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    MONGODB_URI: "mongodb://127.0.0.1:27017/job_hunt_test",
    MONGODB_DB_NAME: "job_hunt_test",
    BETTER_AUTH_SECRET: "y".repeat(32),
    APP_ENCRYPTION_MASTER_KEY: VALID_KEY,
    APP_ENCRYPTION_KEY_VERSION: "1",
  };
}

afterEach(() => {
  resetServerEnvCache();
});

describe("server env validation", () => {
  it("accepts a valid configuration", () => {
    const env = parseServerEnv(baseEnv());
    expect(env.MONGODB_DB_NAME).toBe("job_hunt_test");
    expect(env.APP_ENCRYPTION_KEY_VERSION).toBe(1);
  });

  it("rejects a short auth secret", () => {
    expect(() =>
      parseServerEnv({
        ...baseEnv(),
        BETTER_AUTH_SECRET: "too-short",
      }),
    ).toThrow(/BETTER_AUTH_SECRET/);
  });

  it("rejects an encryption key that is not 32 bytes", () => {
    expect(() =>
      parseServerEnv({
        ...baseEnv(),
        APP_ENCRYPTION_MASTER_KEY: Buffer.from("short").toString("base64"),
      }),
    ).toThrow(/APP_ENCRYPTION_MASTER_KEY/);
  });

  it("reports configuration status without throwing", () => {
    expect(isServerEnvConfigured(baseEnv())).toBe(true);
    expect(isServerEnvConfigured({} as NodeJS.ProcessEnv)).toBe(false);
  });
});
