import { NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth/permissions";
import {
  createImportJob,
  uploadImportFile,
  validateImport,
} from "@/server/services/imports";
import { ImportType } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const actor = await getAppUser();
    if (!actor || actor.status !== "ACTIVE" || actor.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const importTypeRaw = formData.get("importType") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided", code: "IMPORT_VALIDATION" },
        { status: 400 },
      );
    }

    const importType: ImportType =
      importTypeRaw === "QUESTION" ? ImportType.QUESTION : ImportType.STUDENT;

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowedExts = ["xlsx", "xls", "csv"];
    if (!allowedExts.includes(ext)) {
      return NextResponse.json(
        {
          error: `Unsupported file type ".${ext}". Allowed: .xlsx, .xls, .csv`,
          code: "IMPORT_VALIDATION",
        },
        { status: 400 },
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File size exceeds 5 MB limit`,
          code: "IMPORT_VALIDATION",
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    await params; // consume params

    const createResult = await createImportJob(
      {
        importType,
        originalFilename: file.name,
        fileSize: file.size,
      },
      actor.id,
    );

    if (!createResult.success) {
      return NextResponse.json(
        { error: createResult.error.message, code: createResult.error.code },
        { status: 500 },
      );
    }

    const createdJobId = createResult.data.id;

    const uploadResult = await uploadImportFile(
      createdJobId,
      {
        buffer,
        originalFilename: file.name,
        mimeType: file.type,
      },
      actor.id,
    );

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error.message, code: uploadResult.error.code },
        { status: 500 },
      );
    }

    const validateResult = await validateImport(createdJobId, actor.id);

    if (!validateResult.success) {
      return NextResponse.json(
        {
          importJobId: createdJobId,
          summary: {
            totalRows: 0,
            validRows: 0,
            warningRows: 0,
            errorRows: 0,
            status: "FAILED",
          },
          error: validateResult.error.message,
          code: validateResult.error.code,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      importJobId: createdJobId,
      summary: validateResult.data,
    });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
