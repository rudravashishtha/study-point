import { requireAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { FeeAssignmentList } from "@/features/fees/components/FeeAssignmentList";

import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
} from "@/components/layout/page-header";

export default async function AdminFeeAssignmentsPage() {
  await requireAdmin();

  const [assignments, feePlans, sessions, tracks, batches, enrolments] =
    await Promise.all([
      db.studentFeeAssignment.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          enrolment: { include: { student: true } },
          feePlan: true,
          _count: { select: { dues: true } },
        },
      }),
      db.feePlan.findMany({
        orderBy: { name: "asc" },
        include: {
          instalments: { orderBy: { displayOrder: "asc" } },
          academicSession: true,
          curriculumTrack: true,
          batch: true,
        },
      }),
      db.academicSession.findMany({ orderBy: { name: "desc" } }),
      db.curriculumTrack.findMany({ orderBy: { createdAt: "asc" } }),
      db.batch.findMany({ orderBy: { name: "asc" } }),
      db.enrolment.findMany({
        where: { archivedAt: null, status: "active" },
        include: {
          student: true,
          batch: true,
          academicSession: true,
          curriculumTrack: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader>
        <div>
          <PageHeaderHeading>Fee Assignments</PageHeaderHeading>
          <PageHeaderDescription>
            Manage student fee plan assignments.
          </PageHeaderDescription>
        </div>
      </PageHeader>
      <FeeAssignmentList
        assignments={assignments}
        feePlans={feePlans}
        sessions={sessions}
        tracks={tracks}
        batches={batches}
        enrolments={enrolments}
      />
    </div>
  );
}
