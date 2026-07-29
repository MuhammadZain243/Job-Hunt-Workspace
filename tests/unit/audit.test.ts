import { describe, expect, it } from "vitest";

import { sanitizeAuditMetadata } from "@/modules/audit/audit.service";

describe("sanitizeAuditMetadata", () => {
  it("drops sensitive keys and keeps safe values", () => {
    const cleaned = sanitizeAuditMetadata({
      resumeId: "abc",
      password: "secret",
      apiKey: "key",
      token: "tok",
      provider: "cloudinary",
    });

    expect(cleaned).toEqual({
      resumeId: "abc",
      provider: "cloudinary",
    });
  });

  it("truncates oversized metadata", () => {
    const cleaned = sanitizeAuditMetadata({
      blob: "x".repeat(5_000),
    });

    expect(cleaned._truncated).toBe(true);
    expect(typeof cleaned._originalKeys).toBe("string");
  });
});
