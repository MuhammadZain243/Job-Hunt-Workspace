import "server-only";

import { createHash } from "node:crypto";

import { ValidationError } from "@/lib/errors/app-error";

export const MAX_CV_BYTES = 8 * 1024 * 1024;

export const ALLOWED_CV_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type AllowedCvMimeType = (typeof ALLOWED_CV_MIME_TYPES)[number];

function hasPdfSignature(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

function hasZipSignature(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07) &&
    (bytes[3] === 0x04 || bytes[3] === 0x06 || bytes[3] === 0x08)
  );
}

export function resolveCvMimeType(
  fileName: string,
  declaredMime?: string | null,
) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) {
    return "application/pdf" as const;
  }
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document" as const;
  }
  if (
    declaredMime &&
    (ALLOWED_CV_MIME_TYPES as readonly string[]).includes(declaredMime)
  ) {
    return declaredMime as AllowedCvMimeType;
  }
  throw new ValidationError("Only PDF and DOCX files are supported");
}

export function validateCvBytes(input: {
  fileName: string;
  declaredMime?: string | null;
  bytes: Uint8Array;
}) {
  if (input.bytes.byteLength === 0) {
    throw new ValidationError("File is empty");
  }
  if (input.bytes.byteLength > MAX_CV_BYTES) {
    throw new ValidationError("File exceeds the 8 MB limit");
  }

  const mimeType = resolveCvMimeType(input.fileName, input.declaredMime);

  if (mimeType === "application/pdf" && !hasPdfSignature(input.bytes)) {
    throw new ValidationError("File is not a valid PDF");
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
    !hasZipSignature(input.bytes)
  ) {
    throw new ValidationError("File is not a valid DOCX");
  }

  const sha256 = createHash("sha256").update(input.bytes).digest("hex");

  return {
    mimeType,
    sizeBytes: input.bytes.byteLength,
    sha256,
  };
}
