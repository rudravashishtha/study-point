import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  PrismaClient,
  Role,
  FileUploadUsageCategory,
  HomeworkLifecycleState,
} from "@prisma/client";

const { testDbProxy } = vi.hoisted(() => {
  return {
    testDbProxy: new Proxy({} as PrismaClient, {
      get(target, prop) {
        if (!(globalThis as any).__testDb) throw new Error("testDb is not initialized");
        return ((globalThis as any).__testDb as any)[prop];
      },
    }),
  };
});

vi.mock("@/lib/db", () => ({
  db: testDbProxy,
}));

vi.mock("./file-assets", () => ({
  getDownloadUrl: vi
    .fn()
    .mockResolvedValue({ success: true, data: "https://mocked-signed-url" }),
}));

import {
  initializeTestDb,
  teardownTestDb,
  isTestConfigured,
} from "@/lib/test/db-isolation";
import {
  createHomework,
  updateHomework,
  publishHomework,
  archiveHomework,
  listAdminHomework,
  listTeacherBatchHomework,
  listStudentHomework,
  getHomeworkDownloadUrl,
} from "./homework";

const prisma = testDbProxy as PrismaClient;

describe.skipIf(!isTestConfigured)("Homework Service Integration", () => {
  beforeAll(async () => {
    await initializeTestDb();
    // Clean up any leftover data from previous runs to avoid unique constraint collisions
    const db = testDbProxy as PrismaClient;
    await db.homework.deleteMany();
    await db.fileAsset.deleteMany();
    await db.enrolment.deleteMany();
    await db.batchSchedule.deleteMany();
    await db.teacherAssignment.deleteMany();
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
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it("proves the homework authorization and invariant matrix", async () => {
    const db = prisma;

    // ── Setup ──────────────────────────────────────────────
    const admin = await db.appUser.create({
      data: { role: Role.ADMIN, status: "ACTIVE" },
    });

    const session = await db.academicSession.create({
      data: { name: "HW Test Session", isActive: true },
    });

    const board = await db.board.create({ data: { code: "HWBOARD", name: "HW Board" } });
    const subject = await db.subject.create({
      data: { code: "HWMATH", name: "HW Math" },
    });
    const track = await db.curriculumTrack.create({
      data: {
        boardId: board.id,
        subjectId: subject.id,
        classLevel: "X",
        displayName: "HW Track",
      },
    });

    const chapter = await db.chapter.create({
      data: { curriculumTrackId: track.id, name: "HW Chapter 1", displayOrder: 1 },
    });
    const topic = await db.topic.create({
      data: { chapterId: chapter.id, name: "HW Topic 1", displayOrder: 1 },
    });

    const batchA = await db.batch.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        name: "HW Batch A",
        isActive: true,
      },
    });

    const batchB = await db.batch.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        name: "HW Batch B",
        isActive: true,
      },
    });

    const archivedBatch = await db.batch.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        name: "HW Archived Batch",
        isActive: true,
        archivedAt: new Date(),
      },
    });

    // Teacher setup
    const teacherManage = await db.appUser.create({
      data: { role: Role.TEACHER, status: "ACTIVE" },
    });
    const teacherEntity = await db.teacher.create({
      data: { displayName: "HW Teacher Manage" },
    });
    await db.appUser.update({
      where: { id: teacherManage.id },
      data: { teacherId: teacherEntity.id },
    });

    const teacherView = await db.appUser.create({
      data: { role: Role.TEACHER, status: "ACTIVE" },
    });
    const teacherViewEntity = await db.teacher.create({
      data: { displayName: "HW Teacher View" },
    });
    await db.appUser.update({
      where: { id: teacherView.id },
      data: { teacherId: teacherViewEntity.id },
    });

    // Assignments
    await db.teacherAssignment.create({
      data: {
        teacherId: teacherEntity.id,
        batchId: batchA.id,
        permissions: ["HOMEWORK_MANAGE", "HOMEWORK_VIEW"],
      },
    });

    await db.teacherAssignment.create({
      data: {
        teacherId: teacherViewEntity.id,
        batchId: batchA.id,
        permissions: ["HOMEWORK_VIEW"],
      },
    });

    // Archived assignment
    const archivedAssignment = await db.teacherAssignment.create({
      data: {
        teacherId: teacherEntity.id,
        batchId: batchB.id,
        permissions: ["HOMEWORK_MANAGE"],
        archivedAt: new Date(),
      },
    });

    // Student setup
    const studentUser = await db.appUser.create({
      data: { role: Role.STUDENT, status: "ACTIVE" },
    });
    const studentEntity = await db.student.create({
      data: { studentCode: "HWSTU01", fullName: "HW Student" },
    });
    await db.appUser.update({
      where: { id: studentUser.id },
      data: { studentId: studentEntity.id },
    });

    const studentEnrolment = await db.enrolment.create({
      data: {
        studentId: studentEntity.id,
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        batchId: batchA.id,
        joiningDate: new Date(),
        status: "active",
      },
    });

    // FileAsset helpers
    async function createHomeworkAsset(
      batchId: string,
      lifecycleState: string = "ACTIVE",
    ) {
      return db.fileAsset.create({
        data: {
          bucket: "academic-content",
          storageKey: `homework/test-${Date.now()}-${Math.random()}.pdf`,
          originalFilename: "test.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1024,
          storageAccessClass: "PRIVATE",
          lifecycleState: lifecycleState as any,
          usageCategory: "HOMEWORK" as FileUploadUsageCategory,
          uploadScope: "BATCH" as any,
          targetBatchId: batchId,
          uploadedById: admin.id,
        },
      });
    }

    async function createStudyMaterialAsset(batchId: string) {
      return db.fileAsset.create({
        data: {
          bucket: "academic-content",
          storageKey: `material/test-${Date.now()}-${Math.random()}.pdf`,
          originalFilename: "material.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1024,
          storageAccessClass: "PRIVATE",
          lifecycleState: "ACTIVE",
          usageCategory: "STUDY_MATERIAL" as FileUploadUsageCategory,
          uploadScope: "BATCH" as any,
          targetBatchId: batchId,
          uploadedById: admin.id,
        },
      });
    }

    // ════════════════════════════════════════════════════════
    // Test 1: Admin creates homework
    // ════════════════════════════════════════════════════════
    const hwAsset1 = await createHomeworkAsset(batchA.id);
    const createResult = await createHomework(admin.id, {
      batchId: batchA.id,
      chapterId: chapter.id,
      topicId: topic.id,
      title: "Test Homework Alpha",
      description: "Solve all problems",
      fileAssetId: hwAsset1.id,
      assignedDate: "2026-07-01",
      dueDate: "2026-07-10",
    });
    expect(createResult.success).toBe(true);
    const hw1Id = createResult.success ? createResult.data.id : "";

    // Verify session and track derived from batch
    if (createResult.success) {
      expect(createResult.data.academicSessionId).toBe(session.id);
      expect(createResult.data.curriculumTrackId).toBe(track.id);
    }

    // ════════════════════════════════════════════════════════
    // Test 2: usageCategory mismatch rejected
    // ════════════════════════════════════════════════════════
    const matAsset = await createStudyMaterialAsset(batchA.id);
    const rejectResult = await createHomework(admin.id, {
      batchId: batchA.id,
      title: "Should Reject",
      fileAssetId: matAsset.id,
      assignedDate: "2026-07-01",
      dueDate: "2026-07-10",
    });
    expect(rejectResult.success).toBe(false);
    if (!rejectResult.success) {
      expect(rejectResult.error.code).toBe("USAGE_MISMATCH");
    }

    // ════════════════════════════════════════════════════════
    // Test 3: Batch A upload cannot attach to Batch B Homework
    // ════════════════════════════════════════════════════════
    const hwAssetForB = await createHomeworkAsset(batchB.id);
    const batchMismatchResult = await createHomework(admin.id, {
      batchId: batchA.id,
      title: "Batch Mismatch",
      fileAssetId: hwAssetForB.id,
      assignedDate: "2026-07-01",
      dueDate: "2026-07-10",
    });
    expect(batchMismatchResult.success).toBe(false);
    if (!batchMismatchResult.success) {
      expect(batchMismatchResult.error.code).toBe("BATCH_MISMATCH");
    }

    // ════════════════════════════════════════════════════════
    // Test 4: Due date must be >= assigned date
    // ════════════════════════════════════════════════════════
    const dateResult = await createHomework(admin.id, {
      batchId: batchA.id,
      title: "Bad Dates",
      assignedDate: "2026-07-10",
      dueDate: "2026-07-01",
    });
    expect(dateResult.success).toBe(false);
    if (!dateResult.success) {
      expect(dateResult.error.code).toBe("INVALID_DATES");
    }

    // ════════════════════════════════════════════════════════
    // Test 5: HOMEWORK_VIEW Teacher cannot mutate
    // ════════════════════════════════════════════════════════
    const viewOnlyResult = await createHomework(teacherView.id, {
      batchId: batchA.id,
      title: "View Only Cannot Create",
      assignedDate: "2026-07-01",
      dueDate: "2026-07-10",
    });
    expect(viewOnlyResult.success).toBe(false);
    if (!viewOnlyResult.success) {
      expect(viewOnlyResult.error.code).toBe("UNAUTHORIZED");
    }

    // ════════════════════════════════════════════════════════
    // Test 6: HOMEWORK_MANAGE Teacher can mutate only assigned Batch
    // ════════════════════════════════════════════════════════
    const teacherCreateResult = await createHomework(teacherManage.id, {
      batchId: batchA.id,
      title: "Teacher Created Homework",
      assignedDate: "2026-07-01",
      dueDate: "2026-07-10",
    });
    expect(teacherCreateResult.success).toBe(true);

    // Teacher cannot create for unassigned batch
    const unassignedResult = await createHomework(teacherManage.id, {
      batchId: batchB.id,
      title: "Unassigned Batch",
      assignedDate: "2026-07-01",
      dueDate: "2026-07-10",
    });
    expect(unassignedResult.success).toBe(false);
    if (!unassignedResult.success) {
      expect(unassignedResult.error.code).toBe("UNAUTHORIZED");
    }

    // ════════════════════════════════════════════════════════
    // Test 7: Archived assignment revokes Teacher access
    // ════════════════════════════════════════════════════════
    const archiveAssignmentResult = await createHomework(teacherManage.id, {
      batchId: batchB.id,
      title: "Archived Assignment",
      assignedDate: "2026-07-01",
      dueDate: "2026-07-10",
    });
    expect(archiveAssignmentResult.success).toBe(false);
    if (!archiveAssignmentResult.success) {
      // assignment has archivedAt set, so teacher should be unauthorized
      expect(archiveAssignmentResult.error.code).toBe("UNAUTHORIZED");
    }

    // ════════════════════════════════════════════════════════
    // Test 8: Archived Batch is read-only for Admin and Teacher
    // ════════════════════════════════════════════════════════
    const archivedBatchResult = await createHomework(admin.id, {
      batchId: archivedBatch.id,
      title: "Archived Batch Homework",
      assignedDate: "2026-07-01",
      dueDate: "2026-07-10",
    });
    expect(archivedBatchResult.success).toBe(false);
    if (!archivedBatchResult.success) {
      expect(archivedBatchResult.error.code).toBe("ARCHIVED_BATCH");
    }

    // ════════════════════════════════════════════════════════
    // Test 9: publish flow
    // ════════════════════════════════════════════════════════
    const publishResult = await publishHomework(admin.id, hw1Id);
    expect(publishResult.success).toBe(true);
    if (publishResult.success) {
      expect(publishResult.data.lifecycleState).toBe("PUBLISHED");
      expect(publishResult.data.publishedAt).toBeDefined();
    }

    // Repeated publish rejected
    const pub2 = await publishHomework(admin.id, hw1Id);
    expect(pub2.success).toBe(false);
    if (!pub2.success) {
      expect(pub2.error.code).toBe("ALREADY_PUBLISHED");
    }

    // ════════════════════════════════════════════════════════
    // Test 10: Published homework remains editable
    // ════════════════════════════════════════════════════════
    const updateResult = await updateHomework(admin.id, hw1Id, {
      title: "Updated Title",
    });
    expect(updateResult.success).toBe(true);
    if (updateResult.success) {
      expect(updateResult.data.title).toBe("Updated Title");
      expect(updateResult.data.lifecycleState).toBe("PUBLISHED");
    }

    // ════════════════════════════════════════════════════════
    // Test 11: archive + terminal
    // ════════════════════════════════════════════════════════
    const archiveResult = await archiveHomework(admin.id, hw1Id);
    expect(archiveResult.success).toBe(true);
    if (archiveResult.success) {
      expect(archiveResult.data.lifecycleState).toBe("ARCHIVED");
      expect(archiveResult.data.archivedAt).toBeDefined();
    }

    // Cannot update archived
    const updateArchived = await updateHomework(admin.id, hw1Id, { title: "Nope" });
    expect(updateArchived.success).toBe(false);
    if (!updateArchived.success) {
      expect(updateArchived.error.code).toBe("ARCHIVED");
    }

    // Cannot publish archived
    const publishArchived = await publishHomework(admin.id, hw1Id);
    expect(publishArchived.success).toBe(false);
    if (!publishArchived.success) {
      expect(publishArchived.error.code).toBe("ARCHIVED");
    }

    // ════════════════════════════════════════════════════════
    // Test 12: Unfinalized asset rejected
    // ════════════════════════════════════════════════════════
    const pendingAsset = await createHomeworkAsset(batchA.id, "PENDING");
    const pendingResult = await createHomework(admin.id, {
      batchId: batchA.id,
      title: "Pending Asset",
      fileAssetId: pendingAsset.id,
      assignedDate: "2026-07-01",
      dueDate: "2026-07-10",
    });
    expect(pendingResult.success).toBe(false);
    if (!pendingResult.success) {
      expect(pendingResult.error.code).toBe("INVALID_ASSET");
    }

    // ════════════════════════════════════════════════════════
    // Test 13: Student listing — sees only published from active batches
    // ════════════════════════════════════════════════════════
    // Create a published homework visible to student
    const hwPublishedAsset = await createHomeworkAsset(batchA.id);
    const pubHwResult = await createHomework(admin.id, {
      batchId: batchA.id,
      title: "Visible to Student",
      fileAssetId: hwPublishedAsset.id,
      assignedDate: "2026-07-01",
      dueDate: "2026-07-20",
    });
    expect(pubHwResult.success).toBe(true);
    let pubHwId = pubHwResult.success ? pubHwResult.data.id : "";
    await publishHomework(admin.id, pubHwId);

    // Create a draft (should NOT be visible)
    const draftHwResult = await createHomework(admin.id, {
      batchId: batchA.id,
      title: "Draft Homework",
      assignedDate: "2026-07-01",
      dueDate: "2026-07-20",
    });
    expect(draftHwResult.success).toBe(true);

    const studentListResult = await listStudentHomework(studentUser.id);
    expect(studentListResult.success).toBe(true);
    if (studentListResult.success) {
      const titles = studentListResult.data.items.map((h: any) => h.title);
      expect(titles).toContain("Visible to Student");
      expect(titles).not.toContain("Draft Homework");
    }

    // ════════════════════════════════════════════════════════
    // Test 14: Student cannot access another batch's homework
    // ════════════════════════════════════════════════════════
    const hwBatchBResult = await createHomework(admin.id, {
      batchId: batchB.id,
      title: "Batch B Homework",
      assignedDate: "2026-07-01",
      dueDate: "2026-07-20",
    });
    expect(hwBatchBResult.success).toBe(true);
    if (hwBatchBResult.success) {
      await publishHomework(admin.id, hwBatchBResult.data.id);
    }

    const studentList2 = await listStudentHomework(studentUser.id);
    expect(studentList2.success).toBe(true);
    if (studentList2.success) {
      const titles = studentList2.data.items.map((h: any) => h.title);
      expect(titles).not.toContain("Batch B Homework");
    }

    // ════════════════════════════════════════════════════════
    // Test 15: Archived homework hidden from Students
    // ════════════════════════════════════════════════════════
    const hwArchivedForStudent = await createHomework(admin.id, {
      batchId: batchA.id,
      title: "Will Be Archived For Student",
      assignedDate: "2026-07-01",
      dueDate: "2026-07-20",
    });
    expect(hwArchivedForStudent.success).toBe(true);
    let archForStudId = hwArchivedForStudent.success ? hwArchivedForStudent.data.id : "";
    await publishHomework(admin.id, archForStudId);
    await archiveHomework(admin.id, archForStudId);

    const studentList3 = await listStudentHomework(studentUser.id);
    expect(studentList3.success).toBe(true);
    if (studentList3.success) {
      const titles = studentList3.data.items.map((h: any) => h.title);
      expect(titles).not.toContain("Will Be Archived For Student");
    }

    // ════════════════════════════════════════════════════════
    // Test 16: Download starts from homeworkId, raw FileAsset.id fails
    // ════════════════════════════════════════════════════════
    const hwDownloadAsset = await createHomeworkAsset(batchA.id);
    const hwDownloadResult = await createHomework(admin.id, {
      batchId: batchA.id,
      title: "Download Test",
      fileAssetId: hwDownloadAsset.id,
      assignedDate: "2026-07-01",
      dueDate: "2026-07-20",
    });
    expect(hwDownloadResult.success).toBe(true);
    const downloadHwId = hwDownloadResult.success ? hwDownloadResult.data.id : "";
    await publishHomework(admin.id, downloadHwId);

    // Valid download
    const downloadUrl = await getHomeworkDownloadUrl(studentUser.id, downloadHwId);
    expect(downloadUrl.success).toBe(true);

    // Raw fileAsset.id should not grant access (no direct fileAsset download route exists)
    const rawAssetDownloadUrl = await getHomeworkDownloadUrl(
      studentUser.id,
      hwDownloadAsset.id,
    );
    expect(rawAssetDownloadUrl.success).toBe(false);

    // ════════════════════════════════════════════════════════
    // Test 17: Overdue homework remains visible
    // ════════════════════════════════════════════════════════
    const overdueResult = await createHomework(admin.id, {
      batchId: batchA.id,
      title: "Overdue Homework",
      assignedDate: "2026-01-01",
      dueDate: "2026-01-05",
    });
    expect(overdueResult.success).toBe(true);
    if (overdueResult.success) {
      await publishHomework(admin.id, overdueResult.data.id);
    }

    const studentList4 = await listStudentHomework(studentUser.id);
    expect(studentList4.success).toBe(true);
    if (studentList4.success) {
      const titles = studentList4.data.items.map((h: any) => h.title);
      expect(titles).toContain("Overdue Homework");
    }

    // ════════════════════════════════════════════════════════
    // Test 18: Admin listing works
    // ════════════════════════════════════════════════════════
    const adminList = await listAdminHomework(admin.id, { batchId: batchA.id });
    expect(adminList.success).toBe(true);
    if (adminList.success) {
      expect(adminList.data.items.length).toBeGreaterThanOrEqual(5);
    }

    // ════════════════════════════════════════════════════════
    // Test 19: Teacher batch listing
    // ════════════════════════════════════════════════════════
    const teacherList = await listTeacherBatchHomework(teacherManage.id, batchA.id);
    expect(teacherList.success).toBe(true);
    if (teacherList.success) {
      expect(teacherList.data.items.length).toBeGreaterThanOrEqual(1);
    }

    // View-only teacher can list
    const teacherViewList = await listTeacherBatchHomework(teacherView.id, batchA.id);
    expect(teacherViewList.success).toBe(true);

    // Teacher cannot list unassigned batch
    const unassignedList = await listTeacherBatchHomework(teacherView.id, batchB.id);
    expect(unassignedList.success).toBe(false);
  }, 60000);
});
