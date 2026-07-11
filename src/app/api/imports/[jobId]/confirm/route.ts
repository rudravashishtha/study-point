import { NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth/permissions";
import { confirmImport } from "@/server/services/imports";
import { ActorContext } from "@/lib/domain/actor";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const appUser = await getAppUser();
    if (!appUser || appUser.status !== "ACTIVE" || appUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actor: ActorContext = {
      userId: appUser.id,
      role: appUser.role,
      metadata: {
        role: appUser.role,
        status: appUser.status,
        email: appUser.email || undefined,
      },
    };

    const { jobId } = await params;

    const result = await confirmImport(jobId, actor);

    if (!result.success) {
      const status =
        result.error.code === "NOT_FOUND"
          ? 404
          : result.error.code === "INVALID_LIFECYCLE"
            ? 409
            : 422;
      return NextResponse.json(
        { error: result.error.message, code: result.error.code },
        { status },
      );
    }

    return NextResponse.json({ summary: result.data });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
