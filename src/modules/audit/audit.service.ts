import "server-only";

import { connectMongoose } from "@/lib/db/mongoose";
import { AuditEventModel } from "@/modules/audit/audit.model";
import type {
  AuditEventDocument,
  AuditEventInput,
  AuditMetadata,
} from "@/modules/audit/audit.types";

const SENSITIVE_METADATA_KEYS = new Set([
  "password",
  "authorization",
  "cookie",
  "token",
  "apiKey",
  "apikey",
  "api_key",
  "ciphertext",
  "refreshToken",
  "refresh_token",
  "accessToken",
  "access_token",
  "secret",
  "clientSecret",
  "client_secret",
  "privateKey",
  "private_key",
  "BETTER_AUTH_SECRET",
  "APP_ENCRYPTION_MASTER_KEY",
  "MONGODB_URI",
]);

/** Soft cap on serialized metadata size (bytes of JSON). */
const MAX_METADATA_JSON_BYTES = 4_096;

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  if (
    SENSITIVE_METADATA_KEYS.has(key) ||
    SENSITIVE_METADATA_KEYS.has(normalized)
  ) {
    return true;
  }
  return (
    normalized.includes("password") ||
    normalized.includes("secret") ||
    normalized.includes("token") ||
    normalized.includes("authorization") ||
    normalized.includes("ciphertext") ||
    normalized.includes("apikey") ||
    normalized.includes("api_key")
  );
}

/** Exported for unit tests; also used by recordAuditEvent. */
export function sanitizeAuditMetadata(
  metadata: AuditMetadata | undefined,
): AuditMetadata {
  if (!metadata) {
    return {};
  }

  const cleaned: AuditMetadata = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (isSensitiveKey(key)) {
      continue;
    }
    if (
      value === undefined ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      cleaned[key] = value;
    }
  }

  const serialized = JSON.stringify(cleaned);
  if (Buffer.byteLength(serialized, "utf8") <= MAX_METADATA_JSON_BYTES) {
    return cleaned;
  }

  return {
    _truncated: true,
    _originalKeys: Object.keys(cleaned).slice(0, 20).join(","),
  };
}

/**
 * Persist a redacted, size-limited audit event for the authenticated owner.
 */
export async function recordAuditEvent(
  input: AuditEventInput,
): Promise<AuditEventDocument> {
  await connectMongoose();

  const metadata = sanitizeAuditMetadata(input.metadata);
  const createdAt = new Date();

  const doc = await AuditEventModel.create({
    userId: input.userId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    correlationId: input.correlationId,
    metadata,
    createdAt,
  });

  return {
    userId: doc.userId,
    action: doc.action,
    entityType: doc.entityType,
    entityId: doc.entityId ?? undefined,
    correlationId: doc.correlationId ?? undefined,
    metadata: (doc.metadata ?? {}) as AuditMetadata,
    createdAt: doc.createdAt,
  };
}
