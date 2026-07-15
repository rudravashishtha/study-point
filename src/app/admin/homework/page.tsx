import { requireAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { HomeworkList } from "@/features/homework/components/HomeworkList";

import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
} from "@/components/layout/page-header";

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

  const homeworkItems = homework.map((h) => ({
    id: h.id,
    title: h.title,
    lifecycleState: h.lifecycleState,
    academicSessionId: h.academicSessionId,
    curriculumTrackId: h.curriculumTrackId,
    batchId: h.batchId,
    assignedDate: h.assignedDate,
    dueDate: h.dueDate.toISOString().split("T")[0],
    fileAssetId: h.fileAssetId,
    batch: h.batch ? { name: h.batch.name, archivedAt: h.batch.archivedAt } : null,
    chapter: h.chapter ? { name: h.chapter.name } : null,
    topic: h.topic ? { name: h.topic.name } : null,
    fileAsset: h.fileAsset ? { originalFilename: h.fileAsset.originalFilename } : null,
    createdAt: h.createdAt,
    archivedAt: h.archivedAt,
  }));

  return (
    <div className="space-y-6">
      <PageHeader>
        <div>
          <PageHeaderHeading>Homework</PageHeaderHeading>
          <PageHeaderDescription>
            Manage student assignments and tasks.
          </PageHeaderDescription>
        </div>
      </PageHeader>

      <HomeworkList
        homework={homeworkItems}
        sessions={sessions}
        batches={batches}
        tracks={tracks}
      />
    </div>
  );
}
