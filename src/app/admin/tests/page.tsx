import { requireAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { TestList } from "@/features/tests/components/TestList";

export default async function AdminTestsPage() {
  await requireAdmin();

  const [tests, sessions, batches, tracks] = await Promise.all([
    db.test.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        batch: {
          include: { curriculumTrack: { include: { board: true, subject: true } } },
        },
        chapter: true,
        topic: true,
        fileAsset: true,
      },
    }),
    db.academicSession.findMany({ orderBy: { name: "desc" } }),
    db.batch.findMany({
      orderBy: { name: "asc" },
      include: { curriculumTrack: true },
    }),
    db.curriculumTrack.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Tests</h1>
      </div>

      <TestList tests={tests} sessions={sessions} batches={batches} tracks={tracks} />
    </div>
  );
}
