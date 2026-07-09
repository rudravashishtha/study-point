import { requireAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { MaterialList } from "@/features/materials/components/MaterialList";

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Study Materials</h1>
      </div>

      <MaterialList
        materials={materials}
        sessions={sessions}
        batches={batches}
        tracks={tracks}
      />
    </div>
  );
}
