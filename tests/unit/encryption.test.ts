import { afterEach, describe, expect, it } from "vitest";

import {
  decryptSecret,
  encryptSecret,
  fingerprintSecret,
} from "@/lib/encryption/crypto";
import { resetServerEnvCache } from "@/lib/env/server";

const VALID_KEY = Buffer.alloc(32, 7).toString("base64");
const OTHER_KEY = Buffer.alloc(32, 9).toString("base64");

function setEnv(overrides: Record<string, string> = {}) {
  const env = process.env as Record<string, string | undefined>;
  env.NODE_ENV = "test";
  env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  env.MONGODB_URI = "mongodb://127.0.0.1:27017/job_hunt_test";
  env.MONGODB_DB_NAME = "job_hunt_test";
  env.BETTER_AUTH_SECRET = "x".repeat(32);
  env.APP_ENCRYPTION_MASTER_KEY = VALID_KEY;
  env.APP_ENCRYPTION_KEY_VERSION = "1";
  env.CV_STORAGE_DEFAULT_PROVIDER = "local";
  env.LOCAL_PRIVATE_STORAGE_PATH = ".data/private-uploads";
  env.LOG_LEVEL = "error";
  Object.assign(env, overrides);
  resetServerEnvCache();
}

afterEach(() => {
  resetServerEnvCache();
});

describe("encryption service", () => {
  it("round-trips plaintext with AAD", () => {
    setEnv();
    const aad = {
      userId: "user_1",
      provider: "openai",
      credentialId: "cred_1",
    };

    const payload = encryptSecret("super-secret-value", aad);
    expect(payload.algorithm).toBe("aes-256-gcm");
    expect(payload.keyVersion).toBe(1);
    expect(payload.iv).toBeTruthy();
    expect(payload.authTag).toBeTruthy();

    const decrypted = decryptSecret(payload, aad);
    expect(decrypted).toBe("super-secret-value");
  });

  it("fails when the encryption key is wrong", () => {
    setEnv();
    const aad = {
      userId: "user_1",
      provider: "openai",
      credentialId: "cred_1",
    };
    const payload = encryptSecret("secret", aad);

    setEnv({ APP_ENCRYPTION_MASTER_KEY: OTHER_KEY });
    expect(() => decryptSecret(payload, aad)).toThrow();
  });

  it("fails when ciphertext is modified", () => {
    setEnv();
    const aad = {
      userId: "user_1",
      provider: "openai",
      credentialId: "cred_1",
    };
    const payload = encryptSecret("secret", aad);
    const tampered = {
      ...payload,
      ciphertext: Buffer.from("tampered").toString("base64"),
    };

    expect(() => decryptSecret(tampered, aad)).toThrow();
  });

  it("fails when AAD does not match", () => {
    setEnv();
    const payload = encryptSecret("secret", {
      userId: "user_1",
      provider: "openai",
      credentialId: "cred_1",
    });

    expect(() =>
      decryptSecret(payload, {
        userId: "user_2",
        provider: "openai",
        credentialId: "cred_1",
      }),
    ).toThrow();
  });

  it("creates a stable short fingerprint", () => {
    setEnv();
    expect(fingerprintSecret("abc")).toHaveLength(8);
    expect(fingerprintSecret("abc")).toBe(fingerprintSecret("abc"));
  });
});
