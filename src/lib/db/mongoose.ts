import "server-only";

import mongoose from "mongoose";

import { getServerEnv } from "@/lib/env/server";

type MongooseGlobalCache = {
  conn: typeof mongoose | undefined;
  promise: Promise<typeof mongoose> | undefined;
};

function getMongooseCache(): MongooseGlobalCache {
  const globalWithMongoose = globalThis as typeof globalThis & {
    __jobHuntMongoose?: MongooseGlobalCache;
  };
  if (!globalWithMongoose.__jobHuntMongoose) {
    globalWithMongoose.__jobHuntMongoose = {
      conn: undefined,
      promise: undefined,
    };
  }
  return globalWithMongoose.__jobHuntMongoose;
}

/**
 * Cached Mongoose connection for application domain collections.
 * Kept separate from the Better Auth native MongoClient.
 */
export async function connectMongoose(): Promise<typeof mongoose> {
  const cache = getMongooseCache();

  if (cache.conn && mongoose.connection.readyState === 1) {
    return cache.conn;
  }

  if (!cache.promise) {
    const { MONGODB_URI, MONGODB_DB_NAME } = getServerEnv();
    cache.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: MONGODB_DB_NAME,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10_000,
        bufferCommands: false,
      })
      .then((instance) => {
        cache.conn = instance;
        return instance;
      });
  }

  try {
    cache.conn = await cache.promise;
    return cache.conn;
  } catch (error) {
    cache.promise = undefined;
    throw error;
  }
}
