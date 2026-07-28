import "server-only";

import mammoth from "mammoth";
import { extractText } from "unpdf";

import { ValidationError } from "@/lib/errors/app-error";

export async function extractTextFromCv(input: {
  mimeType: string;
  bytes: Uint8Array;
}): Promise<string> {
  if (input.mimeType === "application/pdf") {
    const parsed = await extractText(input.bytes, { mergePages: true });
    const text = (typeof parsed.text === "string" ? parsed.text : "").trim();
    if (!text) {
      throw new ValidationError(
        "Could not extract text from this PDF. OCR is not enabled yet.",
      );
    }
    return text;
  }

  if (
    input.mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const buffer = Buffer.from(input.bytes);
    const parsed = await mammoth.extractRawText({ buffer });
    const text = parsed.value?.trim() ?? "";
    if (!text) {
      throw new ValidationError("Could not extract text from this DOCX file");
    }
    return text;
  }

  throw new ValidationError("Unsupported CV file type for extraction");
}
