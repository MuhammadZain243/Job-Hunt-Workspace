import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { getServerEnv } from "@/lib/env/server";
import type { EncryptedPayload, EncryptionAad } from "@/lib/encryption/types";

const ALGORITHM = "aes-256-gcm" as const;
const IV_LENGTH_BYTES = 12;

function getMasterKey(): Buffer {
  const { APP_ENCRYPTION_MASTER_KEY } = getServerEnv();
  return Buffer.from(APP_ENCRYPTION_MASTER_KEY, "base64");
}

function buildAadBuffer(aad: EncryptionAad): Buffer {
  return Buffer.from(
    `${aad.userId}:${aad.provider}:${aad.credentialId}`,
    "utf8",
  );
}

/**
 * Encrypt plaintext with AES-256-GCM using the application master key.
 * Never log plaintext.
 */
export function encryptSecret(
  plaintext: string,
  aad: EncryptionAad,
  keyVersion?: number,
): EncryptedPayload {
  const env = getServerEnv();
  const key = getMasterKey();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const aadBuffer = buildAadBuffer(aad);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(aadBuffer);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    keyVersion: keyVersion ?? env.APP_ENCRYPTION_KEY_VERSION,
    algorithm: ALGORITHM,
  };
}

/**
 * Decrypt an AES-256-GCM payload. Fails if AAD or auth tag does not match.
 * Never log plaintext.
 */
export function decryptSecret(
  payload: EncryptedPayload,
  aad: EncryptionAad,
): string {
  if (payload.algorithm !== ALGORITHM) {
    throw new Error("Unsupported encryption algorithm");
  }

  const key = getMasterKey();
  const iv = Buffer.from(payload.iv, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");
  const authTag = Buffer.from(payload.authTag, "base64");
  const aadBuffer = buildAadBuffer(aad);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAAD(aadBuffer);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}

/**
 * Short SHA-256 hex prefix for safe display (never the secret itself).
 */
export function fingerprintSecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex").slice(0, 8);
}

/**
 * Decrypt and re-encrypt with the current master key (optional new key version stamp).
 * Ready for multi-key rotation when additional key material is introduced.
 */
export function rotateSecret(
  payload: EncryptedPayload,
  aad: EncryptionAad,
  newKeyVersion?: number,
): EncryptedPayload {
  const plaintext = decryptSecret(payload, aad);
  const version =
    newKeyVersion ?? getServerEnv().APP_ENCRYPTION_KEY_VERSION;
  return encryptSecret(plaintext, aad, version);
}
