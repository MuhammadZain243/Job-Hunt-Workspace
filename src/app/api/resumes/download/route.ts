import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { isAppError } from "@/lib/errors/app-error";
import { ResumeModel } from "@/modules/resumes/resume.model";
import { connectMongoose } from "@/lib/db/mongoose";
import { getCvStorageProviderForName } from "@/providers/storage/storage-provider.factory";
import type { CvStorageProviderName } from "@/providers/storage/storage.types";

export async function GET(request: Request) {
  try {
    const { user } = await requireSession();
    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get("resumeId");
    const key = searchParams.get("key");

    await connectMongoose();

    const resume = resumeId
      ? await ResumeModel.findOne({ _id: resumeId, userId: user.id }).lean()
      : key
        ? await ResumeModel.findOne({
            userId: user.id,
            storageKey: key,
            storageProvider: "local",
          }).lean()
        : null;

    if (!resume) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const provider = await getCvStorageProviderForName(
      user.id,
      resume.storageProvider as CvStorageProviderName,
    );

    if (resume.storageProvider === "local") {
      const bytes = await provider.getFile({
        userId: user.id,
        storageKey: resume.storageKey,
        storageProvider: "local",
      });
      return new NextResponse(Buffer.from(bytes), {
        headers: {
          "Content-Type": resume.mimeType,
          "Content-Disposition": `attachment; filename="${resume.originalFileName.replace(/"/g, "")}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const url = await provider.createDownloadUrl(
      {
        userId: user.id,
        storageKey: resume.storageKey,
        storageProvider: resume.storageProvider as CvStorageProviderName,
        storageMetadata: resume.storageMetadata as Record<
          string,
          string | number | boolean | null | undefined
        >,
      },
      120,
    );

    return NextResponse.redirect(url);
  } catch (error) {
    if (isAppError(error) && error.code === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "Download failed" }, { status: 500 });
  }
}
