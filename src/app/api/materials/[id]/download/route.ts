import { NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth/permissions";
import { getMaterialDownloadUrl } from "@/server/services/study-materials";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await getAppUser();
    if (!actor || actor.status !== "ACTIVE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await getMaterialDownloadUrl(actor.id, id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message, code: result.error.code },
        { status: 403 }, // 403 for download unauthorized/not found logic in this context
      );
    }

    // Redirect to the signed URL
    return NextResponse.redirect(result.data);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
