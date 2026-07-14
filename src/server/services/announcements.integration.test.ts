import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient, Role } from "@prisma/client";

const { testDbProxy } = vi.hoisted(() => {
  return {
    testDbProxy: new Proxy({} as PrismaClient, {
      get(_target, prop) {
        const db = (globalThis as Record<string, unknown>).__testDb as PrismaClient;
        if (!db) throw new Error("testDb is not initialized");
        return (db as unknown as Record<string, unknown>)[prop as string];
      },
    }),
  };
});

vi.mock("@/lib/db", () => ({
  db: testDbProxy,
}));

import {
  initializeTestDb,
  teardownTestDb,
  isTestConfigured,
} from "@/lib/test/db-isolation";
import {
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
  restoreAnnouncement,
  listStudentAnnouncements,
  listPublicAnnouncements,
  getStudentAnnouncementUnreadCount,
  markStudentAnnouncementsRead,
} from "./announcements";
import { ActorContext } from "@/lib/domain/actor";

const prisma = testDbProxy as PrismaClient;

describe.skipIf(!isTestConfigured)("Announcement Service Integration", () => {
  beforeAll(async () => {
    await initializeTestDb();
    const db = testDbProxy as PrismaClient;
    await db.announcement.deleteMany();
    await db.enrolment.deleteMany();
    await db.batchSchedule.deleteMany();
    await db.teacherAssignment.deleteMany();
    await db.test.deleteMany();
    await db.batch.deleteMany();
    await db.topic.deleteMany();
    await db.chapter.deleteMany();
    await db.curriculumTrack.deleteMany();
    await db.subject.deleteMany();
    await db.board.deleteMany();
    await db.academicSession.deleteMany();
    await db.auditLog.deleteMany();
    await db.appUser.deleteMany();
    await db.teacher.deleteMany();
    await db.student.deleteMany();
    await db.studentAnnouncementRead.deleteMany();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  const db = prisma;

  let adminActor: ActorContext;
  let studentActorA: ActorContext;
  let studentActorB: ActorContext;
  let studentActorC: ActorContext;
  let session: Awaited<ReturnType<typeof db.academicSession.create>>;
  let trackA: Awaited<ReturnType<typeof db.curriculumTrack.create>>;
  let trackB: Awaited<ReturnType<typeof db.curriculumTrack.create>>;
  let batchA: Awaited<ReturnType<typeof db.batch.create>>;
  let batchB: Awaited<ReturnType<typeof db.batch.create>>;
  let archivedTrack: Awaited<ReturnType<typeof db.curriculumTrack.create>>;
  let archivedBatch: Awaited<ReturnType<typeof db.batch.create>>;

  beforeAll(async () => {
    const admin = await db.appUser.create({
      data: { role: Role.ADMIN, status: "ACTIVE" },
    });
    adminActor = {
      userId: admin.id,
      role: "ADMIN",
      metadata: { role: "ADMIN", status: "ACTIVE" },
    };

    const stu1 = await db.appUser.create({
      data: { role: Role.STUDENT, status: "ACTIVE" },
    });
    const stu2 = await db.appUser.create({
      data: { role: Role.STUDENT, status: "ACTIVE" },
    });
    const stu3 = await db.appUser.create({
      data: { role: Role.STUDENT, status: "ACTIVE" },
    });
    studentActorA = {
      userId: stu1.id,
      role: "STUDENT",
      metadata: { role: "STUDENT", status: "ACTIVE" },
    };
    studentActorB = {
      userId: stu2.id,
      role: "STUDENT",
      metadata: { role: "STUDENT", status: "ACTIVE" },
    };
    studentActorC = {
      userId: stu3.id,
      role: "STUDENT",
      metadata: { role: "STUDENT", status: "ACTIVE" },
    };

    const board1 = await db.board.create({ data: { code: "BOARD1", name: "Board One" } });
    const subject1 = await db.subject.create({
      data: { code: "MATH", name: "Mathematics" },
    });

    session = await db.academicSession.create({
      data: { name: "2026-27", isActive: true },
    });

    trackA = await db.curriculumTrack.create({
      data: {
        boardId: board1.id,
        subjectId: subject1.id,
        classLevel: "IX",
        displayName: "Track A",
      },
    });
    trackB = await db.curriculumTrack.create({
      data: {
        boardId: board1.id,
        subjectId: subject1.id,
        classLevel: "X",
        displayName: "Track B",
      },
    });
    archivedTrack = await db.curriculumTrack.create({
      data: {
        boardId: board1.id,
        subjectId: subject1.id,
        classLevel: "XI",
        displayName: "Track Archived",
        archivedAt: new Date(),
        archivedBy: admin.id,
      },
    });

    batchA = await db.batch.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: trackA.id,
        name: "Batch A",
      },
    });
    batchB = await db.batch.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: trackB.id,
        name: "Batch B",
      },
    });
    archivedBatch = await db.batch.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: trackA.id,
        name: "Batch Archived",
        archivedAt: new Date(),
        archivedBy: admin.id,
      },
    });

    const s1 = await db.student.create({
      data: { studentCode: "ANNS01", fullName: "Student A" },
    });
    const s2 = await db.student.create({
      data: { studentCode: "ANNS02", fullName: "Student B" },
    });
    const s3 = await db.student.create({
      data: { studentCode: "ANNS03", fullName: "Student C" },
    });

    await db.appUser.update({ where: { id: stu1.id }, data: { studentId: s1.id } });
    await db.appUser.update({ where: { id: stu2.id }, data: { studentId: s2.id } });
    await db.appUser.update({ where: { id: stu3.id }, data: { studentId: s3.id } });

    // Student A: enrolled in Track A, Batch A
    await db.enrolment.create({
      data: {
        studentId: s1.id,
        academicSessionId: session.id,
        curriculumTrackId: trackA.id,
        batchId: batchA.id,
        joiningDate: new Date(),
        status: "active",
      },
    });
    // Student B: enrolled in Track B, Batch B (different track/batch)
    await db.enrolment.create({
      data: {
        studentId: s2.id,
        academicSessionId: session.id,
        curriculumTrackId: trackB.id,
        batchId: batchB.id,
        joiningDate: new Date(),
        status: "active",
      },
    });
    // Student C: no active enrolment
    await db.enrolment.create({
      data: {
        studentId: s3.id,
        academicSessionId: session.id,
        curriculumTrackId: trackA.id,
        batchId: null,
        joiningDate: new Date(),
        status: "withdrawn",
      },
    });
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  // ── CRUD ─────────────────────────────────────────────────────────

  it("1. creates a draft announcement", async () => {
    const res = await createAnnouncement(adminActor, {
      audience: "PUBLIC",
      title: "Draft Notice",
      content: "This is a draft.",
    });
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.publishedAt).toBeNull();
    expect(res.data.archivedAt).toBeNull();
    expect(res.data.title).toBe("Draft Notice");
  });

  it("2. publishes an announcement", async () => {
    const created = await createAnnouncement(adminActor, {
      audience: "PUBLIC",
      title: "Publish Test",
      content: "Will be published.",
    });
    expect(created.success).toBe(true);
    if (!created.success) return;

    const res = await publishAnnouncement(adminActor, created.data.id);
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.publishedAt).not.toBeNull();
  });

  it("3. rejects repeated publish", async () => {
    const created = await createAnnouncement(adminActor, {
      audience: "PUBLIC",
      title: "Double Publish",
      content: "Test",
      publish: true,
    });
    expect(created.success).toBe(true);
    if (!created.success) return;

    const res = await publishAnnouncement(adminActor, created.data.id);
    expect(res.success).toBe(false);
    if (res.success) return;
    expect(res.error.code).toBe("INVALID_LIFECYCLE");
  });

  it("4. editing a published announcement does not modify publishedAt", async () => {
    const created = await createAnnouncement(adminActor, {
      audience: "PUBLIC",
      title: "Edit Preserve PublishedAt",
      content: "Original",
      publish: true,
    });
    expect(created.success).toBe(true);
    if (!created.success) return;
    const originalPublishedAt = created.data.publishedAt;

    // Small delay to ensure time difference
    await new Promise((r) => setTimeout(r, 10));

    const res = await updateAnnouncement(adminActor, created.data.id, {
      title: "Edited Title",
    });
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.publishedAt).toEqual(originalPublishedAt);
    expect(res.data.title).toBe("Edited Title");
  });

  it("5. archives an announcement", async () => {
    const created = await createAnnouncement(adminActor, {
      audience: "PUBLIC",
      title: "Archive Test",
      content: "Will be archived.",
      publish: true,
    });
    expect(created.success).toBe(true);
    if (!created.success) return;

    const res = await archiveAnnouncement(adminActor, created.data.id);
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.archivedAt).not.toBeNull();
  });

  it("6. restores an archived announcement, publishedAt unchanged", async () => {
    const created = await createAnnouncement(adminActor, {
      audience: "PUBLIC",
      title: "Restore Test",
      content: "Will be archived and restored.",
      publish: true,
    });
    expect(created.success).toBe(true);
    if (!created.success) return;

    await archiveAnnouncement(adminActor, created.data.id);
    const restored = await restoreAnnouncement(adminActor, created.data.id);
    expect(restored.success).toBe(true);
    if (!restored.success) return;
    expect(restored.data.archivedAt).toBeNull();
    expect(restored.data.archivedBy).toBeNull();
    expect(restored.data.publishedAt).toEqual(created.data.publishedAt);
  });

  it("7. rejects editing an archived announcement", async () => {
    const created = await createAnnouncement(adminActor, {
      audience: "PUBLIC",
      title: "Archived Edit Reject",
      content: "Test",
    });
    expect(created.success).toBe(true);
    if (!created.success) return;

    await archiveAnnouncement(adminActor, created.data.id);
    const res = await updateAnnouncement(adminActor, created.data.id, {
      title: "Should Fail",
    });
    expect(res.success).toBe(false);
    if (res.success) return;
    expect(res.error.code).toBe("INVALID_LIFECYCLE");
  });

  // ── Audience Validation ─────────────────────────────────────────

  it("8. PUBLIC: rejects curriculumTrackId and batchId", async () => {
    const res = await createAnnouncement(adminActor, {
      audience: "PUBLIC",
      title: "Bad Public",
      content: "Test",
      curriculumTrackId: trackA.id,
    });
    expect(res.success).toBe(false);
    if (res.success) return;
    expect(res.error.code).toBe("INVALID_RELATION");
  });

  it("9. ALL_STUDENTS: rejects curriculumTrackId and batchId", async () => {
    const res = await createAnnouncement(adminActor, {
      audience: "ALL_STUDENTS",
      title: "Bad All",
      content: "Test",
      batchId: batchA.id,
    });
    expect(res.success).toBe(false);
    if (res.success) return;
    expect(res.error.code).toBe("INVALID_RELATION");
  });

  it("10. CURRICULUM_TRACK: requires curriculumTrackId, rejects batchId", async () => {
    const resNoTrack = await createAnnouncement(adminActor, {
      audience: "CURRICULUM_TRACK",
      title: "No Track",
      content: "Test",
    });
    expect(resNoTrack.success).toBe(false);

    const resWithBatch = await createAnnouncement(adminActor, {
      audience: "CURRICULUM_TRACK",
      title: "With Batch",
      content: "Test",
      curriculumTrackId: trackA.id,
      batchId: batchA.id,
    });
    expect(resWithBatch.success).toBe(false);

    const resGood = await createAnnouncement(adminActor, {
      audience: "CURRICULUM_TRACK",
      title: "Good Track",
      content: "Test",
      curriculumTrackId: trackA.id,
    });
    expect(resGood.success).toBe(true);
  });

  it("11. BATCH: derives curriculumTrackId from batch", async () => {
    const res = await createAnnouncement(adminActor, {
      audience: "BATCH",
      title: "Batch Derived",
      content: "Test",
      batchId: batchA.id,
    });
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.curriculumTrackId).toBe(trackA.id);
    expect(res.data.batchId).toBe(batchA.id);
  });

  it("12. BATCH: rejects client-supplied curriculumTrackId", async () => {
    const res = await createAnnouncement(adminActor, {
      audience: "BATCH",
      title: "Bad Batch",
      content: "Test",
      batchId: batchA.id,
      curriculumTrackId: trackA.id,
    });
    expect(res.success).toBe(false);
    if (res.success) return;
    expect(res.error.code).toBe("INVALID_RELATION");
  });

  it("13. BATCH: rejects archived batch", async () => {
    const res = await createAnnouncement(adminActor, {
      audience: "BATCH",
      title: "Archived Batch",
      content: "Test",
      batchId: archivedBatch.id,
    });
    expect(res.success).toBe(false);
    if (res.success) return;
    expect(res.error.code).toBe("ARCHIVE_BLOCKED");
  });

  it("14. CURRICULUM_TRACK: rejects archived curriculum track", async () => {
    const res = await createAnnouncement(adminActor, {
      audience: "CURRICULUM_TRACK",
      title: "Archived Track",
      content: "Test",
      curriculumTrackId: archivedTrack.id,
    });
    expect(res.success).toBe(false);
    if (res.success) return;
    expect(res.error.code).toBe("ARCHIVE_BLOCKED");
  });

  // ── Student Visibility ──────────────────────────────────────────

  it("15. student sees PUBLIC announcements", async () => {
    await createAnnouncement(adminActor, {
      audience: "PUBLIC",
      title: "Public For Student",
      content: "Visible to all",
      publish: true,
    });
    const res = await listStudentAnnouncements(studentActorA);
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.items.some((a) => a.title === "Public For Student")).toBe(true);
  });

  it("16. student sees ALL_STUDENTS announcements", async () => {
    await createAnnouncement(adminActor, {
      audience: "ALL_STUDENTS",
      title: "All Students Notice",
      content: "Test",
      publish: true,
    });
    const res = await listStudentAnnouncements(studentActorA);
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.items.some((a) => a.title === "All Students Notice")).toBe(true);
  });

  it("17. student sees CURRICULUM_TRACK announcements for their track", async () => {
    const a = await createAnnouncement(adminActor, {
      audience: "CURRICULUM_TRACK",
      title: "Track A Only",
      content: "Test",
      curriculumTrackId: trackA.id,
      publish: true,
    });
    expect(a.success).toBe(true);

    const resA = await listStudentAnnouncements(studentActorA);
    expect(resA.success).toBe(true);
    if (!resA.success) return;
    expect(resA.data.items.some((a) => a.title === "Track A Only")).toBe(true);
  });

  it("18. student sees BATCH announcements for their batch", async () => {
    const a = await createAnnouncement(adminActor, {
      audience: "BATCH",
      title: "Batch A Only",
      content: "Test",
      batchId: batchA.id,
      publish: true,
    });
    expect(a.success).toBe(true);

    const resA = await listStudentAnnouncements(studentActorA);
    expect(resA.success).toBe(true);
    if (!resA.success) return;
    expect(resA.data.items.some((a) => a.title === "Batch A Only")).toBe(true);
  });

  it("19. cross-track invisibility: student in Track B cannot see Track A announcement", async () => {
    const resB = await listStudentAnnouncements(studentActorB);
    expect(resB.success).toBe(true);
    if (!resB.success) return;
    // Student B is in Track B, so should not see Track A announcement
    expect(resB.data.items.some((a) => a.title === "Track A Only")).toBe(false);
  });

  it("20. cross-batch invisibility: student in Batch B cannot see Batch A announcement", async () => {
    const resB = await listStudentAnnouncements(studentActorB);
    expect(resB.success).toBe(true);
    if (!resB.success) return;
    expect(resB.data.items.some((a) => a.title === "Batch A Only")).toBe(false);
  });

  it("21. draft announcement hidden from student", async () => {
    await createAnnouncement(adminActor, {
      audience: "PUBLIC",
      title: "Draft Hidden",
      content: "Should not see",
    });
    const res = await listStudentAnnouncements(studentActorA);
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.items.some((a) => a.title === "Draft Hidden")).toBe(false);
  });

  it("22. expired announcement hidden from student", async () => {
    await createAnnouncement(adminActor, {
      audience: "PUBLIC",
      title: "Expired Notice",
      content: "Test",
      publish: true,
      expiresAt: "2020-01-01T00:00:00.000Z",
    });
    const res = await listStudentAnnouncements(studentActorA);
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.items.some((a) => a.title === "Expired Notice")).toBe(false);
  });

  it("23. archived announcement hidden from student", async () => {
    const a = await createAnnouncement(adminActor, {
      audience: "PUBLIC",
      title: "Archived Hidden",
      content: "Test",
      publish: true,
    });
    expect(a.success).toBe(true);
    if (!a.success) return;
    await archiveAnnouncement(adminActor, a.data.id);

    const res = await listStudentAnnouncements(studentActorA);
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.items.some((a) => a.title === "Archived Hidden")).toBe(false);
  });

  // ── Public Listing ──────────────────────────────────────────────

  it("24. public listing only shows PUBLIC, published, not expired, not archived", async () => {
    const res = await listPublicAnnouncements();
    expect(res.success).toBe(true);
    if (!res.success) return;
    // Should see PUBLIC announcements
    expect(res.data.items.some((a) => a.title === "Public For Student")).toBe(true);
    // Should NOT see track/batch announcements
    expect(res.data.items.some((a) => a.title === "Track A Only")).toBe(false);
    expect(res.data.items.some((a) => a.title === "Batch A Only")).toBe(false);
    // Should NOT see expired
    expect(res.data.items.some((a) => a.title === "Expired Notice")).toBe(false);
    // Should NOT see archived
    expect(res.data.items.some((a) => a.title === "Archived Hidden")).toBe(false);
  });

  // ── Audit ───────────────────────────────────────────────────────

  it("25. audit log created for announcement actions", async () => {
    const auditBefore = await db.auditLog.count({
      where: { entityType: "Announcement" },
    });

    const a = await createAnnouncement(adminActor, {
      audience: "PUBLIC",
      title: "Audit Test",
      content: "Test",
    });
    expect(a.success).toBe(true);
    if (!a.success) return;

    await publishAnnouncement(adminActor, a.data.id);
    await archiveAnnouncement(adminActor, a.data.id);
    await restoreAnnouncement(adminActor, a.data.id);

    const auditCount = await db.auditLog.count({
      where: { entityType: "Announcement" },
    });
    expect(auditCount).toBe(auditBefore + 4);
  });

  // ── Ordering ────────────────────────────────────────────────────

  it("26. student announcements ordered by priority DESC, publishedAt DESC, createdAt DESC", async () => {
    // Create HIGH priority announcement published now
    const high = await createAnnouncement(adminActor, {
      audience: "PUBLIC",
      title: "High Priority",
      content: "Test",
      priority: "HIGH",
      publish: true,
    });
    expect(high.success).toBe(true);

    const res = await listStudentAnnouncements(studentActorA);
    expect(res.success).toBe(true);
    if (!res.success) return;

    const items = res.data.items;
    for (let i = 1; i < items.length; i++) {
      const prev = items[i - 1];
      const curr = items[i];

      const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2 };

      // Compare priority
      const prevP = priorityOrder[prev.priority as keyof typeof priorityOrder] ?? 99;
      const currP = priorityOrder[curr.priority as keyof typeof priorityOrder] ?? 99;

      if (prevP < currP) continue; // correctly ordered by priority
      if (prevP > currP) {
        expect(prevP).toBeLessThanOrEqual(currP);
        continue;
      }

      // Same priority: compare publishedAt
      const prevPub = prev.publishedAt?.getTime() ?? 0;
      const currPub = curr.publishedAt?.getTime() ?? 0;
      if (prevPub > currPub) continue;
      if (prevPub < currPub) {
        expect(prevPub).toBeGreaterThanOrEqual(currPub);
        continue;
      }

      // Same publishedAt: compare createdAt
      expect(prev.createdAt.getTime()).toBeGreaterThanOrEqual(curr.createdAt.getTime());
    }
  });

  // ── Edge Cases ─────────────────────────────────────────────────

  it("27. student with no active enrolment sees no announcements", async () => {
    const res = await listStudentAnnouncements(studentActorC);
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.items).toHaveLength(0);
  });

  // ── Student Read State ───────────────────────────────────────────

  it("28. unread count is visibility-scoped and mark-read ignores ids the student cannot see", async () => {
    const s1 = await db.student.findUnique({ where: { studentCode: "ANNS01" } });
    const s2 = await db.student.findUnique({ where: { studentCode: "ANNS02" } });
    const s3 = await db.student.findUnique({ where: { studentCode: "ANNS03" } });
    expect(s1 && s2 && s3).toBeTruthy();
    if (!s1 || !s2 || !s3) return;

    const now = new Date();
    const past = new Date(now.getTime() - 86400000);

    // Visible to Student A (trackA / batchA): PUBLIC, CURRICULUM_TRACK(trackA), BATCH(batchA)
    const pub = await db.announcement.create({
      data: {
        audience: "PUBLIC",
        title: "Public A",
        content: "x",
        publishedAt: now,
      },
    });
    const trackAOnly = await db.announcement.create({
      data: {
        audience: "CURRICULUM_TRACK",
        curriculumTrackId: trackA.id,
        title: "Track A Only",
        content: "x",
        publishedAt: now,
      },
    });
    const batchAOnly = await db.announcement.create({
      data: {
        audience: "BATCH",
        batchId: batchA.id,
        title: "Batch A Only",
        content: "x",
        publishedAt: now,
      },
    });
    // Visible only to Student B (trackB)
    const trackBOnly = await db.announcement.create({
      data: {
        audience: "CURRICULUM_TRACK",
        curriculumTrackId: trackB.id,
        title: "Track B Only",
        content: "x",
        publishedAt: now,
      },
    });
    // Not visible to anyone: expired, draft, archived-batch
    await db.announcement.create({
      data: {
        audience: "PUBLIC",
        title: "Expired",
        content: "x",
        publishedAt: now,
        expiresAt: past,
      },
    });
    await db.announcement.create({
      data: { audience: "PUBLIC", title: "Draft", content: "x" },
    });
    await db.announcement.create({
      data: {
        audience: "BATCH",
        batchId: archivedBatch.id,
        title: "Archived Batch",
        content: "x",
        publishedAt: now,
      },
    });

    // Student A sees exactly 3 visible announcements
    const beforeA = await getStudentAnnouncementUnreadCount(s1.id);
    expect(beforeA).toBe(3);

    // Student B sees only the PUBLIC + Track B announcements = 2
    const beforeB = await getStudentAnnouncementUnreadCount(s2.id);
    expect(beforeB).toBe(2);

    // Student C (no active enrolment) sees nothing
    const beforeC = await getStudentAnnouncementUnreadCount(s3.id);
    expect(beforeC).toBe(0);

    // Marking read must ignore ids the student cannot see (trackBOnly)
    const mark = await markStudentAnnouncementsRead(s1.id, [
      pub.id,
      trackAOnly.id,
      trackBOnly.id, // not visible to A → must be ignored
    ]);
    expect(mark.success).toBe(true);
    if (!mark.success) return;
    expect(mark.data).toBe(2); // only pub + trackAOnly actually marked

    // After marking, A's unread drops to 1 (batchAOnly remains)
    const afterA = await getStudentAnnouncementUnreadCount(s1.id);
    expect(afterA).toBe(1);

    // B's unread is untouched by A's mark-read
    const afterB = await getStudentAnnouncementUnreadCount(s2.id);
    expect(afterB).toBe(2);

    // A cannot have a read receipt for the announcement it cannot see
    const rogueReads = await db.studentAnnouncementRead.count({
      where: { studentId: s1.id, announcementId: trackBOnly.id },
    });
    expect(rogueReads).toBe(0);

    // Marking the remaining visible one clears A's unread
    const mark2 = await markStudentAnnouncementsRead(s1.id, [batchAOnly.id]);
    expect(mark2.success).toBe(true);
    if (!mark2.success) return;
    expect(await getStudentAnnouncementUnreadCount(s1.id)).toBe(0);
  });
});
