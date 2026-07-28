import { describe, expect, it } from "vitest";

import { PolicyViolationError } from "@/lib/errors/app-error";

describe("local storage production policy", () => {
  it("documents that local provider is production-forbidden", () => {
    const error = new PolicyViolationError(
      "Local CV storage is not allowed in production",
    );
    expect(error.code).toBe("POLICY_VIOLATION");
    expect(error.statusCode).toBe(422);
  });
});
