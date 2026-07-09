import { NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth/permissions";
import { createUploadIntent, uploadIntentSchema } from "@/server/services/file-assets";

export async function POST(req: NextRequest) {
  try {
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
  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
