import type { MongoClient } from "mongodb";
import type mongoose from "mongoose";

export type MongoGlobalCache = {
  client: MongoClient | undefined;
  promise: Promise<MongoClient> | undefined;
};

export type MongooseGlobalCache = {
  conn: typeof mongoose | undefined;
  promise: Promise<typeof mongoose> | undefined;
};

declare global {
  // eslint-disable-next-line no-var -- Next.js hot-reload connection cache
  var __jobHuntMongo: MongoGlobalCache | undefined;
  // eslint-disable-next-line no-var -- Next.js hot-reload connection cache
  var __jobHuntMongoose: MongooseGlobalCache | undefined;
}

export {};
