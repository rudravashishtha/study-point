import { requireAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { HomeworkList } from "@/features/homework/components/HomeworkList";

export default async function AdminHomeworkPage() {
  await requireAdmin();

  const [homework, sessions, batches, tracks] = await Promise.all([
    db.homework.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        batch: {
          include: { curriculumTrack: { include: { board: true, subject: true } } },
        },
        chapter: true,
        topic: true,
        fileAsset: true,
        academicSession: true,
        curriculumTrack: true,
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
        <h1 className="text-3xl font-bold tracking-tight">Homework</h1>
      </div>

      <HomeworkList
        homework={homework}
        sessions={sessions}
        batches={batches}
        tracks={tracks}
      />
    </div>
  );
}
