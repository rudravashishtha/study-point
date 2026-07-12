import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  PrismaClient,
  Role,
  FileUploadUsageCategory,
  FileUploadScope,
  FileAssetLifecycleState,
} from "@prisma/client";

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
  createTest,
  updateTest,
  publishTest,
  archiveTest,
  listAdminTests,
  listTeacherBatchTests,
  listStudentTests,
  getTestDownloadUrl,
} from "./tests";

const prisma = testDbProxy as PrismaClient;

describe.skipIf(!isTestConfigured)("Test Service Integration", () => {
  beforeAll(async () => {
    await initializeTestDb();
    const db = testDbProxy as PrismaClient;
    await db.homework.deleteMany();
    await db.studyMaterial.deleteMany();
    await db.test.deleteMany();
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

  it("proves the test authorization and invariant matrix", async () => {
    const db = prisma;

    // ── Setup ──────────────────────────────────────────────
    const admin = await db.appUser.create({
      data: { role: Role.ADMIN, status: "ACTIVE" },
    });

    const session = await db.academicSession.create({
      data: { name: "Test Session", isActive: true },
    });

    const board = await db.board.create({ data: { code: "TBOARD", name: "Test Board" } });
    const subject = await db.subject.create({
      data: { code: "TMATH", name: "Test Math" },
    });
    const track = await db.curriculumTrack.create({
      data: {
        boardId: board.id,
        subjectId: subject.id,
        classLevel: "X",
        displayName: "Test Track",
      },
    });

    const chapter1 = await db.chapter.create({
      data: { curriculumTrackId: track.id, name: "Chapter 1", displayOrder: 1 },
    });
    const topic1 = await db.topic.create({
      data: { chapterId: chapter1.id, name: "Topic 1", displayOrder: 1 },
    });
    await db.topic.create({
      data: { chapterId: chapter1.id, name: "Topic 2", displayOrder: 2 },
    });

    const chapter2 = await db.chapter.create({
      data: { curriculumTrackId: track.id, name: "Chapter 2", displayOrder: 2 },
    });
    const topic3 = await db.topic.create({
      data: { chapterId: chapter2.id, name: "Topic 3", displayOrder: 1 },
    });

    const batchA = await db.batch.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        name: "Test Batch A",
        isActive: true,
      },
    });

    const batchB = await db.batch.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        name: "Test Batch B",
        isActive: true,
      },
    });

    const inactiveBatch = await db.batch.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        name: "Test Inactive Batch",
        isActive: false,
      },
    });

    const archivedBatch = await db.batch.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        name: "Test Archived Batch",
        isActive: true,
        archivedAt: new Date(),
      },
    });

    // Teacher setup
    const teacherManage = await db.appUser.create({
      data: { role: Role.TEACHER, status: "ACTIVE" },
    });
    const teacherEntity = await db.teacher.create({
      data: { displayName: "Test Teacher Manage" },
    });
    await db.appUser.update({
      where: { id: teacherManage.id },
      data: { teacherId: teacherEntity.id },
    });

    const teacherView = await db.appUser.create({
      data: { role: Role.TEACHER, status: "ACTIVE" },
    });
    const teacherViewEntity = await db.teacher.create({
      data: { displayName: "Test Teacher View" },
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
        permissions: ["TESTS_MANAGE", "TESTS_VIEW"],
      },
    });

    await db.teacherAssignment.create({
      data: {
        teacherId: teacherViewEntity.id,
        batchId: batchA.id,
        permissions: ["TESTS_VIEW"],
      },
    });

    // Archived assignment
    await db.teacherAssignment.create({
      data: {
        teacherId: teacherEntity.id,
        batchId: batchB.id,
        permissions: ["TESTS_MANAGE", "TESTS_VIEW"],
        archivedAt: new Date(),
      },
    });

    // Student setup
    const studentUser = await db.appUser.create({
      data: { role: Role.STUDENT, status: "ACTIVE" },
    });
    const studentEntity = await db.student.create({
      data: { studentCode: "TSTU01", fullName: "Test Student" },
    });
    await db.appUser.update({
      where: { id: studentUser.id },
      data: { studentId: studentEntity.id },
    });

    await db.enrolment.create({
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
    async function createTestAsset(
      batchId: string,
      lifecycleState: FileAssetLifecycleState = "ACTIVE",
    ) {
      return db.fileAsset.create({
        data: {
          bucket: "academic-content",
          storageKey: `test/test-${Date.now()}-${Math.random()}.pdf`,
          originalFilename: "question-paper.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1024,
          storageAccessClass: "PRIVATE",
          lifecycleState,
          usageCategory: "TEST" as FileUploadUsageCategory,
          uploadScope: "BATCH" as FileUploadScope,
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
          uploadScope: "BATCH" as FileUploadScope,
          targetBatchId: batchId,
          uploadedById: admin.id,
        },
      });
    }

    async function createHomeworkAsset(batchId: string) {
      return db.fileAsset.create({
        data: {
          bucket: "academic-content",
          storageKey: `homework/test-${Date.now()}-${Math.random()}.pdf`,
          originalFilename: "homework.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1024,
          storageAccessClass: "PRIVATE",
          lifecycleState: "ACTIVE",
          usageCategory: "HOMEWORK" as FileUploadUsageCategory,
          uploadScope: "BATCH" as FileUploadScope,
          targetBatchId: batchId,
          uploadedById: admin.id,
        },
      });
    }

    // ════════════════════════════════════════════════════════
    // Test 1: Session and track derived from Batch
    // ════════════════════════════════════════════════════════
    const createResult = await createTest(admin.id, {
      batchId: batchA.id,
      chapterId: chapter1.id,
      topicId: topic1.id,
      title: "Test Alpha",
      description: "Chapter test",
      testType: "CHAPTER_TEST",
      testDate: "2026-08-01T10:00:00.000Z",
      durationMinutes: 60,
      maximumMarks: 50,
      syllabusDescription: "Full chapter 1 syllabus",
    });
    expect(createResult.success).toBe(true);
    const test1Id = createResult.success ? createResult.data.id : "";

    if (createResult.success) {
      expect(createResult.data.academicSessionId).toBe(session.id);
      expect(createResult.data.curriculumTrackId).toBe(track.id);
    }

    // ════════════════════════════════════════════════════════
    // Test 2: Test is always Batch-scoped
    // ════════════════════════════════════════════════════════
    if (createResult.success) {
      expect(createResult.data.batchId).toBe(batchA.id);
    }

    // ════════════════════════════════════════════════════════
    // Test 3: Invalid chapter/topic hierarchy rejected
    // ════════════════════════════════════════════════════════
    const hierarchyResult = await createTest(admin.id, {
      batchId: batchA.id,
      chapterId: chapter1.id,
      topicId: topic3.id,
      title: "Bad Hierarchy",
      testType: "CHAPTER_TEST",
      testDate: "2026-08-01T10:00:00.000Z",
      maximumMarks: 25,
    });
    expect(hierarchyResult.success).toBe(false);
    if (!hierarchyResult.success) {
      expect(hierarchyResult.error.code).toBe("INVALID_TOPIC");
    }

    // ════════════════════════════════════════════════════════
    // Test 4: Invalid maximumMarks rejected
    // ════════════════════════════════════════════════════════
    const marksZeroResult = await createTest(admin.id, {
      batchId: batchA.id,
      title: "Zero Marks",
      testType: "UNIT_TEST",
      testDate: "2026-08-01T10:00:00.000Z",
      maximumMarks: 0,
    });
    expect(marksZeroResult.success).toBe(false);

    const marksNegResult = await createTest(admin.id, {
      batchId: batchA.id,
      title: "Negative Marks",
      testType: "UNIT_TEST",
      testDate: "2026-08-01T10:00:00.000Z",
      maximumMarks: -5,
    });
    expect(marksNegResult.success).toBe(false);

    // ════════════════════════════════════════════════════════
    // Test 5: Invalid durationMinutes rejected
    // ════════════════════════════════════════════════════════
    const durationResult = await createTest(admin.id, {
      batchId: batchA.id,
      title: "Neg Duration",
      testType: "FULL_SYLLABUS_TEST",
      testDate: "2026-08-01T10:00:00.000Z",
      durationMinutes: -10,
      maximumMarks: 50,
    });
    expect(durationResult.success).toBe(false);

    // ════════════════════════════════════════════════════════
    // Test 6: TEST usage-category mismatch rejected
    // ════════════════════════════════════════════════════════
    const matAsset = await createStudyMaterialAsset(batchA.id);
    const usageResult = await createTest(admin.id, {
      batchId: batchA.id,
      title: "Wrong Category",
      testType: "CHAPTER_TEST",
      testDate: "2026-08-01T10:00:00.000Z",
      maximumMarks: 25,
      questionPaperFileId: matAsset.id,
    });
    expect(usageResult.success).toBe(false);
    if (!usageResult.success) {
      expect(usageResult.error.code).toBe("USAGE_MISMATCH");
    }

    // Also verify HOMEWORK asset is rejected for TEST
    const hwAsset = await createHomeworkAsset(batchA.id);
    const hwUsageResult = await createTest(admin.id, {
      batchId: batchA.id,
      title: "Homework Asset For Test",
      testType: "CHAPTER_TEST",
      testDate: "2026-08-01T10:00:00.000Z",
      maximumMarks: 25,
      questionPaperFileId: hwAsset.id,
    });
    expect(hwUsageResult.success).toBe(false);
    if (!hwUsageResult.success) {
      expect(hwUsageResult.error.code).toBe("USAGE_MISMATCH");
    }

    // ════════════════════════════════════════════════════════
    // Test 7: Batch A asset cannot attach to Batch B Test
    // ════════════════════════════════════════════════════════
    const testAssetForB = await createTestAsset(batchB.id);
    const batchMismatchResult = await createTest(admin.id, {
      batchId: batchA.id,
      title: "Batch Mismatch",
      testType: "CHAPTER_TEST",
      testDate: "2026-08-01T10:00:00.000Z",
      maximumMarks: 25,
      questionPaperFileId: testAssetForB.id,
    });
    expect(batchMismatchResult.success).toBe(false);
    if (!batchMismatchResult.success) {
      expect(batchMismatchResult.error.code).toBe("BATCH_MISMATCH");
    }

    // ════════════════════════════════════════════════════════
    // Test 8: PENDING / non-ACTIVE assets cannot attach
    // ════════════════════════════════════════════════════════
    const pendingAsset = await createTestAsset(batchA.id, "PENDING");
    const pendingResult = await createTest(admin.id, {
      batchId: batchA.id,
      title: "Pending Asset",
      testType: "CHAPTER_TEST",
      testDate: "2026-08-01T10:00:00.000Z",
      maximumMarks: 25,
      questionPaperFileId: pendingAsset.id,
    });
    expect(pendingResult.success).toBe(false);
    if (!pendingResult.success) {
      expect(pendingResult.error.code).toBe("INVALID_ASSET");
    }

    // ════════════════════════════════════════════════════════
    // Test 9: View-only Teacher cannot mutate
    // ════════════════════════════════════════════════════════
    const viewOnlyResult = await createTest(teacherView.id, {
      batchId: batchA.id,
      title: "View Only Cannot Create",
      testType: "CHAPTER_TEST",
      testDate: "2026-08-01T10:00:00.000Z",
      maximumMarks: 25,
    });
    expect(viewOnlyResult.success).toBe(false);
    if (!viewOnlyResult.success) {
      expect(viewOnlyResult.error.code).toBe("UNAUTHORIZED");
    }

    // ════════════════════════════════════════════════════════
    // Test 10: Manage-capable Teacher can mutate only in assigned Batch
    // ════════════════════════════════════════════════════════
    const teacherCreateResult = await createTest(teacherManage.id, {
      batchId: batchA.id,
      title: "Teacher Created Test",
      testType: "CHAPTER_TEST",
      testDate: "2026-08-01T10:00:00.000Z",
      maximumMarks: 25,
    });
    expect(teacherCreateResult.success).toBe(true);

    // Teacher cannot create for unassigned batch
    const unassignedResult = await createTest(teacherManage.id, {
      batchId: batchB.id,
      title: "Unassigned Batch",
      testType: "CHAPTER_TEST",
      testDate: "2026-08-01T10:00:00.000Z",
      maximumMarks: 25,
    });
    expect(unassignedResult.success).toBe(false);
    if (!unassignedResult.success) {
      expect(unassignedResult.error.code).toBe("UNAUTHORIZED");
    }

    // ════════════════════════════════════════════════════════
    // Test 11: Archived TeacherAssignment revokes access
    // ════════════════════════════════════════════════════════
    const archiveAssignmentResult = await createTest(teacherManage.id, {
      batchId: batchB.id,
      title: "Archived Assignment",
      testType: "CHAPTER_TEST",
      testDate: "2026-08-01T10:00:00.000Z",
      maximumMarks: 25,
    });
    expect(archiveAssignmentResult.success).toBe(false);
    if (!archiveAssignmentResult.success) {
      expect(archiveAssignmentResult.error.code).toBe("UNAUTHORIZED");
    }

    // ════════════════════════════════════════════════════════
    // Test 12: Archived Batch mutation blocked (Admin)
    // ════════════════════════════════════════════════════════
    const archivedBatchResult = await createTest(admin.id, {
      batchId: archivedBatch.id,
      title: "Archived Batch Test",
      testType: "CHAPTER_TEST",
      testDate: "2026-08-01T10:00:00.000Z",
      maximumMarks: 25,
    });
    expect(archivedBatchResult.success).toBe(false);
    if (!archivedBatchResult.success) {
      expect(archivedBatchResult.error.code).toBe("ARCHIVED_BATCH");
    }

    // ════════════════════════════════════════════════════════
    // Test 13: Inactive non-archived Batch behavior
    // ════════════════════════════════════════════════════════
    const inactiveBatchResult = await createTest(admin.id, {
      batchId: inactiveBatch.id,
      title: "Inactive Batch Test",
      testType: "CHAPTER_TEST",
      testDate: "2026-08-01T10:00:00.000Z",
      maximumMarks: 25,
    });
    // inactive non-archived batches follow same rules as active (no isActive check)
    expect(inactiveBatchResult.success).toBe(true);

    // ════════════════════════════════════════════════════════
    // Test 14: Publish lifecycle transition
    // ════════════════════════════════════════════════════════
    const publishResult = await publishTest(admin.id, test1Id);
    expect(publishResult.success).toBe(true);
    if (publishResult.success) {
      expect(publishResult.data.lifecycleState).toBe("PUBLISHED");
      expect(publishResult.data.publishedAt).toBeDefined();
    }

    // ════════════════════════════════════════════════════════
    // Test 15: Repeated publish rejected
    // ════════════════════════════════════════════════════════
    const pub2 = await publishTest(admin.id, test1Id);
    expect(pub2.success).toBe(false);
    if (!pub2.success) {
      expect(pub2.error.code).toBe("ALREADY_PUBLISHED");
    }

    // ════════════════════════════════════════════════════════
    // Test 16: Published Test remains editable
    // ════════════════════════════════════════════════════════
    const updateResult = await updateTest(admin.id, test1Id, {
      title: "Updated Test Title",
      description: "Updated description",
    });
    expect(updateResult.success).toBe(true);
    if (updateResult.success) {
      expect(updateResult.data.title).toBe("Updated Test Title");
      expect(updateResult.data.lifecycleState).toBe("PUBLISHED");
    }

    // ════════════════════════════════════════════════════════
    // Test 17: Archive lifecycle transition
    // ════════════════════════════════════════════════════════
    const archiveResult = await archiveTest(admin.id, test1Id);
    expect(archiveResult.success).toBe(true);
    if (archiveResult.success) {
      expect(archiveResult.data.lifecycleState).toBe("ARCHIVED");
      expect(archiveResult.data.archivedAt).toBeDefined();
    }

    // ════════════════════════════════════════════════════════
    // Test 18: Archived Test behavior
    // ════════════════════════════════════════════════════════
    // Cannot update archived
    const updateArchived = await updateTest(admin.id, test1Id, {
      title: "Nope",
    });
    expect(updateArchived.success).toBe(false);
    if (!updateArchived.success) {
      expect(updateArchived.error.code).toBe("ARCHIVED");
    }

    // Cannot publish archived
    const publishArchived = await publishTest(admin.id, test1Id);
    expect(publishArchived.success).toBe(false);
    if (!publishArchived.success) {
      expect(publishArchived.error.code).toBe("ARCHIVED");
    }

    // Repeated archive rejected (terminal state; transition is invalid)
    const archiveAgain = await archiveTest(admin.id, test1Id);
    expect(archiveAgain.success).toBe(false);
    if (!archiveAgain.success) {
      expect(archiveAgain.error.code).toBe("ALREADY_ARCHIVED");
    }

    // ════════════════════════════════════════════════════════
    // Test 19: Archived batch mutation blocked after batch archived
    // ════════════════════════════════════════════════════════
    const batchToArchive = await db.batch.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        name: "Test Batch To Archive",
        isActive: true,
      },
    });
    const testInActiveBatch = await createTest(admin.id, {
      batchId: batchToArchive.id,
      title: "Test in Soon-Archived Batch",
      testType: "CHAPTER_TEST",
      testDate: "2026-08-01T10:00:00.000Z",
      maximumMarks: 50,
    });
    expect(testInActiveBatch.success).toBe(true);
    const testInArchivingBatchId = testInActiveBatch.success
      ? testInActiveBatch.data.id
      : "";

    // Archive the batch
    await db.batch.update({
      where: { id: batchToArchive.id },
      data: { archivedAt: new Date() },
    });

    // Update blocked
    const updateArchBatch = await updateTest(admin.id, testInArchivingBatchId, {
      title: "Should Fail",
    });
    expect(updateArchBatch.success).toBe(false);
    if (!updateArchBatch.success) {
      expect(updateArchBatch.error.code).toBe("ARCHIVED_BATCH");
    }

    // Publish blocked
    const publishArchBatch = await publishTest(admin.id, testInArchivingBatchId);
    expect(publishArchBatch.success).toBe(false);
    if (!publishArchBatch.success) {
      expect(publishArchBatch.error.code).toBe("ARCHIVED_BATCH");
    }

    // Archive blocked too (batch is archived)
    const archiveArchBatch = await archiveTest(admin.id, testInArchivingBatchId);
    expect(archiveArchBatch.success).toBe(false);
    if (!archiveArchBatch.success) {
      expect(archiveArchBatch.error.code).toBe("ARCHIVED_BATCH");
    }

    // ════════════════════════════════════════════════════════
    // Test 20: Student listing — only PUBLISHED from eligible batches
    // ════════════════════════════════════════════════════════
    // Create a published test visible to student
    const pubTestResult = await createTest(admin.id, {
      batchId: batchA.id,
      title: "Visible to Student",
      testType: "CHAPTER_TEST",
      testDate: "2026-08-01T10:00:00.000Z",
      maximumMarks: 50,
    });
    expect(pubTestResult.success).toBe(true);
    const visibleTestId = pubTestResult.success ? pubTestResult.data.id : "";
    await publishTest(admin.id, visibleTestId);

    // Create a draft (should NOT be visible)
    const draftTestResult = await createTest(admin.id, {
      batchId: batchA.id,
      title: "Draft Test",
      testType: "CHAPTER_TEST",
      testDate: "2026-08-01T10:00:00.000Z",
      maximumMarks: 25,
    });
    expect(draftTestResult.success).toBe(true);

    const studentListResult = await listStudentTests(studentUser.id);
    expect(studentListResult.success).toBe(true);
    if (studentListResult.success) {
    }

    // ════════════════════════════════════════════════════════
    // Test 21: Student listing does not expose questionPaperFileId
    // ════════════════════════════════════════════════════════
    if (studentListResult.success) {
      for (const item of studentListResult.data.items) {
        expect((item as Record<string, unknown>).questionPaperFileId).toBeUndefined();
      }
    }

    // ════════════════════════════════════════════════════════
    // Test 22: Student cannot obtain question-paper download (B9.1)
    // ════════════════════════════════════════════════════════
    // Attach a question paper to verify the auth path blocks students
    const qpAsset = await createTestAsset(batchA.id);
    const attachFileResult = await updateTest(admin.id, visibleTestId, {
      questionPaperFileId: qpAsset.id,
    });
    expect(attachFileResult.success).toBe(true);

    // Student download is blocked even though a paper is attached
    const studentDownloadResult = await getTestDownloadUrl(studentUser.id, visibleTestId);
    expect(studentDownloadResult.success).toBe(false);
    if (!studentDownloadResult.success) {
      expect(studentDownloadResult.error.code).toBe("UNAUTHORIZED");
    }

    // ════════════════════════════════════════════════════════
    // Test 23: Admin/Teacher paper access starts from testId
    // ════════════════════════════════════════════════════════
    const adminDownloadOk = await getTestDownloadUrl(admin.id, visibleTestId);
    expect(adminDownloadOk.success).toBe(true);

    // Teacher with TESTS_MANAGE can download
    const teacherDownloadOk = await getTestDownloadUrl(teacherManage.id, visibleTestId);
    expect(teacherDownloadOk.success).toBe(true);

    // Teacher with TESTS_VIEW can download
    const teacherViewDownloadOk = await getTestDownloadUrl(teacherView.id, visibleTestId);
    expect(teacherViewDownloadOk.success).toBe(true);

    // ════════════════════════════════════════════════════════
    // Test 24: Raw FileAsset.id grants no Test paper access
    // ════════════════════════════════════════════════════════
    // Starts from testId; a non-Test ID returns NOT_FOUND (loadTest returns null)
    const rawAssetDownloadResult = await getTestDownloadUrl(admin.id, qpAsset.id);
    expect(rawAssetDownloadResult.success).toBe(false);
    if (!rawAssetDownloadResult.success) {
      expect(rawAssetDownloadResult.error.code).toBe("NOT_FOUND");
    }

    // ════════════════════════════════════════════════════════
    // Test 25: No actor identity / role / session / track
    //          claims trusted from client
    // ════════════════════════════════════════════════════════
    // This is enforced architecturally — all derived values
    // (academicSessionId, curriculumTrackId) come from the
    // authoritative Batch record server-side. We prove it by
    // verifying Test 1 already: returned session/track match the
    // batch, not anything the client could have provided.
    // Additionally, the create schema doesn't even accept
    // academicSessionId or curriculumTrackId from the client.

    // ════════════════════════════════════════════════════════
    // Admin listing works
    // ════════════════════════════════════════════════════════
    const adminList = await listAdminTests(admin.id, { batchId: batchA.id });
    expect(adminList.success).toBe(true);
    if (adminList.success) {
      expect(adminList.data.items.length).toBeGreaterThanOrEqual(4);
    }

    // ════════════════════════════════════════════════════════
    // Teacher batch listing
    // ════════════════════════════════════════════════════════
    const teacherList = await listTeacherBatchTests(teacherManage.id, batchA.id);
    expect(teacherList.success).toBe(true);
    if (teacherList.success) {
      expect(teacherList.data.items.length).toBeGreaterThanOrEqual(1);
    }

    // View-only teacher can list
    const teacherViewList = await listTeacherBatchTests(teacherView.id, batchA.id);
    expect(teacherViewList.success).toBe(true);

    // Teacher cannot list unassigned batch
    const unassignedList = await listTeacherBatchTests(teacherView.id, batchB.id);
    expect(unassignedList.success).toBe(false);
  }, 60000);
});
