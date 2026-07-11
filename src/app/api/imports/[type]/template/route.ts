import { NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth/permissions";
import { generateStudentTemplate } from "@/server/services/imports";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const actor = await getAppUser();
    if (!actor || actor.status !== "ACTIVE" || actor.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await params;

    if (type !== "student") {
      return NextResponse.json(
        { error: `Unsupported import type: ${type}` },
        { status: 400 },
      );
    }

    const result = await generateStudentTemplate();
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message, code: result.error.code },
        { status: 500 },
      );
    }

    const buf = result.data.buffer;
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

    return new NextResponse(ab as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${result.data.filename}"`,
        "Content-Length": result.data.buffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
