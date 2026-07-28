import "server-only";

import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

import { ValidationError } from "@/lib/errors/app-error";

export async function extractTextFromCv(input: {
  mimeType: string;
  bytes: Uint8Array;
}): Promise<string> {
  const buffer = Buffer.from(input.bytes);

  if (input.mimeType === "application/pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      const text = parsed.text?.trim() ?? "";
      if (!text) {
        throw new ValidationError(
          "Could not extract text from this PDF. OCR is not enabled yet.",
        );
      }
      return text;
    } finally {
      await parser.destroy();
    }
  }

  if (
    input.mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const parsed = await mammoth.extractRawText({ buffer });
    const text = parsed.value?.trim() ?? "";
    if (!text) {
      throw new ValidationError("Could not extract text from this DOCX file");
    }
    return text;
  }

  throw new ValidationError("Unsupported CV file type for extraction");
}
