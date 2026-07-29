import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { connectMongoose } from "@/lib/db/mongoose";
import { isAppError } from "@/lib/errors/app-error";
import { ResumeModel } from "@/modules/resumes/resume.model";
import { getCvStorageProviderForName } from "@/providers/storage/storage-provider.factory";
import type { CvStorageProviderName } from "@/providers/storage/storage.types";

export async function GET(request: Request) {
  try {
    const { user } = await requireSession();
    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get("resumeId");

    if (!resumeId) {
      return NextResponse.json(
        { ok: false, error: "Missing resumeId" },
        { status: 400 },
      );
    }

    await connectMongoose();

    const resume = await ResumeModel.findOne({
      _id: resumeId,
      userId: user.id,
    }).lean();

    if (!resume) {
      return NextResponse.json(
        { ok: false, error: "Not found" },
        { status: 404 },
      );
    }

    const provider = await getCvStorageProviderForName(
      user.id,
      resume.storageProvider as CvStorageProviderName,
    );

    const bytes = await provider.getFile({
      userId: user.id,
      storageKey: resume.storageKey,
      storageProvider: resume.storageProvider as CvStorageProviderName,
      storageMetadata: resume.storageMetadata as Record<
        string,
        string | number | boolean | null | undefined
      >,
    });

    const safeName = resume.originalFileName.replace(/"/g, "");

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": resume.mimeType,
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "no-store",
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch (error) {
    if (isAppError(error) && error.code === "UNAUTHORIZED") {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Download failed" },
      { status: 500 },
    );
  }
}
