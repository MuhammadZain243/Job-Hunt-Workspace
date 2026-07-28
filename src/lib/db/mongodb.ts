import "server-only";

import { MongoClient, type Db, type MongoClientOptions } from "mongodb";

import { getServerEnv } from "@/lib/env/server";

const ATLAS_CLIENT_OPTIONS: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: 60_000,
  serverSelectionTimeoutMS: 10_000,
  connectTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  retryWrites: true,
  retryReads: true,
};

type MongoGlobalCache = {
  client: MongoClient | undefined;
  promise: Promise<MongoClient> | undefined;
};

function getMongoCache(): MongoGlobalCache {
  const globalWithMongo = globalThis as typeof globalThis & {
    __jobHuntMongo?: MongoGlobalCache;
  };
  if (!globalWithMongo.__jobHuntMongo) {
    globalWithMongo.__jobHuntMongo = { client: undefined, promise: undefined };
  }
  return globalWithMongo.__jobHuntMongo;
}

/**
 * Returns a cached MongoClient suitable for Better Auth and health checks.
 * Reuses a single connection promise across Next.js hot reloads in development.
 */
export async function getMongoClient(): Promise<MongoClient> {
  const cache = getMongoCache();
  if (cache.client) {
    return cache.client;
  }

  if (!cache.promise) {
    const { MONGODB_URI } = getServerEnv();
    const client = new MongoClient(MONGODB_URI, ATLAS_CLIENT_OPTIONS);
    cache.promise = client.connect().then((connected) => {
      cache.client = connected;
      return connected;
    });
  }

  return cache.promise;
}

/**
 * Database handle for Better Auth collections (native driver).
 */
export async function getAuthDb(): Promise<Db> {
  const client = await getMongoClient();
  const { MONGODB_DB_NAME } = getServerEnv();
  return client.db(MONGODB_DB_NAME);
}
