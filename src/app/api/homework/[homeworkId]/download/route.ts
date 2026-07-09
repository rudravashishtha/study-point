import { NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth/permissions";
import { getHomeworkDownloadUrl } from "@/server/services/homework";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ homeworkId: string }> },
) {
  try {
    const actor = await getAppUser();
    if (!actor || actor.status !== "ACTIVE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { homeworkId } = await params;
    const result = await getHomeworkDownloadUrl(actor.id, homeworkId);

    if (!result.success) {
      const status = result.error.code === "NOT_FOUND" ? 404 : 403;
      return NextResponse.json(
        { error: result.error.message, code: result.error.code },
        { status },
      );
    }

    return NextResponse.redirect(result.data);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
