import "server-only";

import { createHash } from "node:crypto";

import { connectMongoose } from "@/lib/db/mongoose";
import { SourceDocumentModel } from "@/modules/sources/source-document.model";

export async function createManualSourceDocument(input: {
  userId: string;
  url?: string;
  title?: string;
  content: string;
}) {
  await connectMongoose();
  const contentHash = createHash("sha256").update(input.content).digest("hex");

  const doc = await SourceDocumentModel.create({
    userId: input.userId,
    type: input.url ? "url" : "manual_text",
    url: input.url?.trim() ?? "",
    title: input.title?.trim() ?? "",
    content: input.content,
    contentHash,
    provider: "manual",
    collectedAt: new Date(),
    retentionClass: "owner_data",
    metadata: {},
  });

  return {
    id: doc._id.toString(),
    contentHash: doc.contentHash,
    type: doc.type,
    url: doc.url ?? "",
  };
}
