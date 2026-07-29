export type SourceRef = {
  sourceDocumentId?: string | null;
  sourceType: string;
  sourceUrl?: string | null;
  collectedAt: Date;
  fieldPath?: string | null;
  quoteHash?: string | null;
  confidence: number;
  reviewedByUser: boolean;
};

export const verificationStatusValues = [
  "unverified",
  "verified",
  "disputed",
] as const;

export type VerificationStatus = (typeof verificationStatusValues)[number];
