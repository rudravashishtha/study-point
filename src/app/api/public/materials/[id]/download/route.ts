import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { getDownloadUrl } from "@/server/services/file-assets";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const material = await prisma.studyMaterial.findUnique({
    where: { id },
    include: { fileAsset: true },
  });

  if (
    !material ||
    material.visibility !== "CURRICULUM_TRACK" ||
    material.lifecycleState !== "PUBLISHED" ||
    !material.fileAssetId ||
    !material.fileAsset ||
    material.fileAsset.lifecycleState !== "ACTIVE"
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await getDownloadUrl(material.fileAssetId);
  if (!result.success || !result.data) {
    return NextResponse.json({ error: "Download unavailable" }, { status: 404 });
  }

  return NextResponse.redirect(result.data);
}
