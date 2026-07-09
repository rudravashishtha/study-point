import { NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/lib/auth/permissions";
import { finalizeUpload } from "@/server/services/file-assets";
import { z } from "zod";

const finalizeSchema = z.object({
  fileAssetId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const actor = await getAppUser();
    if (!actor || actor.status !== "ACTIVE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = finalizeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await finalizeUpload(actor.id, parsed.data.fileAssetId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message, code: result.error.code },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, fileAssetId: result.data.id });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
