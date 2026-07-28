import { describe, expect, it } from "vitest";

import { ValidationError } from "@/lib/errors/app-error";
import { validateCvBytes } from "@/modules/resumes/resume.validation";
import { getCloudinaryProtectedUploadOptions } from "@/providers/storage/cloudinary/cloudinary.storage-provider";
import { buildDraftCandidateProfile } from "@/modules/candidate-profile/candidate-profile.parser";

describe("validateCvBytes", () => {
  it("accepts a PDF signature", () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const result = validateCvBytes({
      fileName: "cv.pdf",
      declaredMime: "application/pdf",
      bytes,
    });
    expect(result.mimeType).toBe("application/pdf");
    expect(result.sha256).toHaveLength(64);
  });

  it("rejects non-pdf bytes for pdf extension", () => {
    expect(() =>
      validateCvBytes({
        fileName: "cv.pdf",
        bytes: new Uint8Array([0x00, 0x01, 0x02, 0x03]),
      }),
    ).toThrow(ValidationError);
  });

  it("accepts a DOCX zip signature", () => {
    const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
    const result = validateCvBytes({
      fileName: "cv.docx",
      bytes,
    });
    expect(result.mimeType).toContain("wordprocessingml");
  });
});

describe("cloudinary upload options", () => {
  it("enforces raw authenticated delivery", () => {
    const options = getCloudinaryProtectedUploadOptions("user-1");
    expect(options.resource_type).toBe("raw");
    expect(options.type).toBe("authenticated");
    expect(options.folder).toContain("user-1");
  });
});

describe("buildDraftCandidateProfile", () => {
  it("extracts email and skills with evidence", () => {
    const draft = buildDraftCandidateProfile(
      "Jane Doe\njane@example.com\nSkills\nTypeScript, React, MongoDB",
    );
    expect(draft.contact.email).toBe("jane@example.com");
    expect(draft.skills.some((skill) => skill.name === "TypeScript")).toBe(
      true,
    );
    expect(draft.skills[0]?.evidence.source).toBe("cv_text");
  });
});
