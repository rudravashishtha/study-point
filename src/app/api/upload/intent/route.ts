import { NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth/permissions";
import { createUploadIntent } from "@/server/services/file-assets";

const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"];

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const hasValidOrigin =
      !origin ||
      !referer ||
      allowedOrigins.some(
        (allowed) =>
          (origin && origin.startsWith(allowed)) ||
          (referer && referer.startsWith(allowed)),
      );
    if (!hasValidOrigin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const actor = await getAppUser();
    if (!actor || actor.status !== "ACTIVE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = await createUploadIntent(actor.id, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message, code: result.error.code },
        { status: 400 },
      );
    }

    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
