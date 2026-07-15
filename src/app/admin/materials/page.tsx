import { requireAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { MaterialList } from "@/features/materials/components/MaterialList";

import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
} from "@/components/layout/page-header";

export default async function AdminMaterialsPage() {
  await requireAdmin();

  const [materials, sessions, batches, tracks] = await Promise.all([
    db.studyMaterial.findMany({
      orderBy: { createdAt: "desc" },
      include: { fileAsset: true },
    }),
    db.academicSession.findMany({ orderBy: { name: "desc" } }),
    db.batch.findMany({ orderBy: { name: "asc" } }),
    db.curriculumTrack.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader>
        <div>
          <PageHeaderHeading>Study Materials</PageHeaderHeading>
          <PageHeaderDescription>
            Manage course resources and materials.
          </PageHeaderDescription>
        </div>
      </PageHeader>

      <MaterialList
        materials={materials}
        sessions={sessions}
        batches={batches}
        tracks={tracks}
      />
    </div>
  );
}
