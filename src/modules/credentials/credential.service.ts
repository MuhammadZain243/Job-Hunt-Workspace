import "server-only";

import { Types } from "mongoose";

import { connectMongoose } from "@/lib/db/mongoose";
import { ProviderAuthError, ValidationError } from "@/lib/errors/app-error";
import {
  decryptSecret,
  encryptSecret,
  fingerprintSecret,
} from "@/lib/encryption/crypto";
import { logger } from "@/lib/logger/logger";
import { EncryptedCredentialModel } from "@/modules/credentials/credential.model";
import { ProviderConnectionModel } from "@/modules/credentials/provider-connection.model";
import type { StoredCredentialProvider } from "@/modules/credentials/credential.types";

function maskValue(value: string, keepStart = 3, keepEnd = 2): string {
  if (value.length <= keepStart + keepEnd) {
    return "*".repeat(value.length);
  }

  return `${value.slice(0, keepStart)}${"*".repeat(value.length - keepStart - keepEnd)}${value.slice(-keepEnd)}`;
}

export async function saveProviderSecret(input: {
  userId: string;
  provider: StoredCredentialProvider;
  accountLabel: string;
  secret: string;
  externalAccountId?: string;
}) {
  await connectMongoose();

  const existing = await EncryptedCredentialModel.findOne({
    userId: input.userId,
    provider: input.provider,
    revokedAt: null,
  });

  // AAD includes credentialId. The Mongo _id used at encrypt time MUST match
  // the stored document _id or decrypt will fail authentication.
  const credentialObjectId = existing?._id ?? new Types.ObjectId();
  const credentialId = credentialObjectId.toString();

  const payload = encryptSecret(input.secret, {
    userId: input.userId,
    provider: input.provider,
    credentialId,
  });

  const fingerprint = fingerprintSecret(input.secret);

  let credential;
  if (existing) {
    credential = await EncryptedCredentialModel.findOneAndUpdate(
      { _id: existing._id },
      {
        $set: {
          accountLabel: input.accountLabel,
          ciphertext: payload.ciphertext,
          iv: payload.iv,
          authTag: payload.authTag,
          algorithm: payload.algorithm,
          keyVersion: payload.keyVersion,
          secretFingerprint: fingerprint,
          rotatedAt: new Date(),
          revokedAt: null,
        },
      },
      { returnDocument: "after" },
    );
  } else {
    credential = await EncryptedCredentialModel.create({
      _id: credentialObjectId,
      userId: input.userId,
      provider: input.provider,
      accountLabel: input.accountLabel,
      ciphertext: payload.ciphertext,
      iv: payload.iv,
      authTag: payload.authTag,
      algorithm: payload.algorithm,
      keyVersion: payload.keyVersion,
      secretFingerprint: fingerprint,
      rotatedAt: null,
      revokedAt: null,
    });
  }

  if (!credential) {
    throw new ValidationError("Could not save provider credentials");
  }

  await ProviderConnectionModel.findOneAndUpdate(
    { userId: input.userId, provider: input.provider },
    {
      userId: input.userId,
      provider: input.provider,
      accountLabel: input.accountLabel,
      externalAccountId: input.externalAccountId,
      status: "connected",
      credentialId: credential._id.toString(),
      lastCheckedAt: new Date(),
      lastErrorCode: null,
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    },
  );

  return {
    credentialId: credential._id.toString(),
    fingerprint,
  };
}

export async function getProviderSecret(input: {
  userId: string;
  provider: StoredCredentialProvider;
}): Promise<string | null> {
  await connectMongoose();

  const credential = await EncryptedCredentialModel.findOne({
    userId: input.userId,
    provider: input.provider,
    revokedAt: null,
  }).lean();

  if (!credential) {
    return null;
  }

  try {
    return decryptSecret(
      {
        ciphertext: credential.ciphertext,
        iv: credential.iv,
        authTag: credential.authTag,
        algorithm: "aes-256-gcm",
        keyVersion: credential.keyVersion,
      },
      {
        userId: input.userId,
        provider: input.provider,
        credentialId: credential._id.toString(),
      },
    );
  } catch (error) {
    logger.warn(
      {
        provider: input.provider,
        reason:
          error instanceof Error
            ? error.message.slice(0, 120)
            : "decrypt_failed",
      },
      "Failed to decrypt provider credential",
    );
    throw new ProviderAuthError(
      "Saved credentials could not be decrypted. Disconnect and reconnect the provider.",
    );
  }
}

export async function listProviderConnections(userId: string) {
  await connectMongoose();
  const connections = await ProviderConnectionModel.find({
    userId,
    status: "connected",
  }).lean();

  return connections.map((connection) => ({
    provider: connection.provider,
    accountLabel: connection.accountLabel,
    status: connection.status,
    lastCheckedAt: connection.lastCheckedAt ?? null,
    maskedLabel:
      connection.provider === "cloudinary" || connection.provider === "openai"
        ? connection.accountLabel
        : maskValue(connection.accountLabel),
  }));
}

export async function disconnectProviderConfiguration(input: {
  userId: string;
  provider: StoredCredentialProvider;
}) {
  await connectMongoose();

  // Hard-delete secrets and connection metadata so disconnect matches
  // "Disconnect and delete" and leaves no provider rows in MongoDB.
  await EncryptedCredentialModel.deleteMany({
    userId: input.userId,
    provider: input.provider,
  });

  await ProviderConnectionModel.deleteMany({
    userId: input.userId,
    provider: input.provider,
  });
}
