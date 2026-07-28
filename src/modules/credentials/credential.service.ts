import "server-only";

import { Types } from "mongoose";

import { connectMongoose } from "@/lib/db/mongoose";
import {
  decryptSecret,
  encryptSecret,
  fingerprintSecret,
} from "@/lib/encryption/crypto";
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
  }).lean();

  const credentialId = existing?._id?.toString() ?? new Types.ObjectId().toString();
  const payload = encryptSecret(input.secret, {
    userId: input.userId,
    provider: input.provider,
    credentialId,
  });

  const fingerprint = fingerprintSecret(input.secret);

  const credential = await EncryptedCredentialModel.findOneAndUpdate(
    { userId: input.userId, provider: input.provider, revokedAt: null },
    {
      userId: input.userId,
      provider: input.provider,
      accountLabel: input.accountLabel,
      ciphertext: payload.ciphertext,
      iv: payload.iv,
      authTag: payload.authTag,
      algorithm: payload.algorithm,
      keyVersion: payload.keyVersion,
      secretFingerprint: fingerprint,
      rotatedAt: existing ? new Date() : null,
      revokedAt: null,
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    },
  );

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
      connection.provider === "cloudinary"
        ? connection.accountLabel
        : maskValue(connection.accountLabel),
  }));
}

export async function disconnectProviderConfiguration(input: {
  userId: string;
  provider: StoredCredentialProvider;
}) {
  await connectMongoose();

  await EncryptedCredentialModel.updateMany(
    {
      userId: input.userId,
      provider: input.provider,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
  );

  await ProviderConnectionModel.findOneAndUpdate(
    {
      userId: input.userId,
      provider: input.provider,
    },
    {
      $set: {
        status: "disconnected",
        lastCheckedAt: new Date(),
        lastErrorCode: null,
        credentialId: "",
      },
    },
    {
      returnDocument: "after",
    },
  );
}
