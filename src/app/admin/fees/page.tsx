import { requireAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { FeePlanList } from "@/features/fees/components/FeePlanList";

export default async function AdminFeesPage() {
  await requireAdmin();

  const [feePlans, sessions, tracks, batches] = await Promise.all([
    db.feePlan.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        instalments: { orderBy: { displayOrder: "asc" } },
        academicSession: true,
        curriculumTrack: { include: { board: true, subject: true } },
        batch: true,
      },
    }),
    db.academicSession.findMany({ orderBy: { name: "desc" } }),
    db.curriculumTrack.findMany({ orderBy: { createdAt: "asc" } }),
    db.batch.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Fee Plans</h1>
      </div>

      <FeePlanList
        feePlans={feePlans}
        sessions={sessions}
        tracks={tracks}
        batches={batches}
      />
    </div>
  );
}
