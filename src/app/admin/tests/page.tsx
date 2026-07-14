import { requireAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { TestList } from "@/features/tests/components/TestList";

import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
} from "@/components/layout/page-header";

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
      <PageHeader>
        <div>
          <PageHeaderHeading>Tests</PageHeaderHeading>
          <PageHeaderDescription>Manage student tests and evaluations.</PageHeaderDescription>
        </div>
      </PageHeader>

      <TestList tests={tests} sessions={sessions} batches={batches} tracks={tracks} />
    </div>
  );
}
