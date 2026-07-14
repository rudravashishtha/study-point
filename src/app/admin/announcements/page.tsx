import { requireAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
} from "@/components/layout/page-header";
import { AnnouncementList } from "@/features/announcements/components/AnnouncementList";

export default async function AdminAnnouncementsPage() {
  await requireAdmin();

  const [announcements, sessions, tracks, batches] = await Promise.all([
    db.announcement.findMany({
      orderBy: [
        { priority: "desc" },
        { publishedAt: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      include: {
        academicSession: { select: { id: true, name: true } },
        curriculumTrack: { select: { id: true, displayName: true } },
        batch: { select: { id: true, name: true } },
      },
    }),
    db.academicSession.findMany({ orderBy: { name: "desc" } }),
    db.curriculumTrack.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, displayName: true, archivedAt: true },
    }),
    db.batch.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader>
        <div>
          <PageHeaderHeading>Notices</PageHeaderHeading>
          <PageHeaderDescription>Manage institute announcements and notices.</PageHeaderDescription>
        </div>
      </PageHeader>

      <AnnouncementList
        announcements={announcements}
        sessions={sessions}
        tracks={tracks}
        batches={batches}
      />
    </div>
  );
}
