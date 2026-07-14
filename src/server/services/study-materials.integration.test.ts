import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  PrismaClient,
  Role,
  ClassLevel,
  StudyMaterialResourceType,
  StudyMaterialVisibility,
  StudyMaterialLifecycleState,
} from "@prisma/client";

const { testDbProxy } = vi.hoisted(() => {
  return {
    testDbProxy: new Proxy({} as PrismaClient, {
      get(_target, prop) {
        const g = globalThis as Record<string, unknown>;
        if (!g.__testDb) throw new Error("testDb is not initialized");
        return (g.__testDb as Record<string | symbol, unknown>)[prop];
      },
    }),
  };
});

vi.mock("@/lib/db", () => ({
  db: testDbProxy,
}));

// Mock file-assets to avoid real Supabase calls
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
import { listStudentMaterials } from "./study-materials";

const prisma = testDbProxy as PrismaClient;

describe.skipIf(!isTestConfigured)("StudyMaterials Student List Integration", () => {
  beforeAll(async () => {
    await initializeTestDb();
    const db = testDbProxy as PrismaClient;
    await db.studyMaterial.deleteMany();
    await db.enrolment.deleteMany();
    await db.batch.deleteMany();
    await db.curriculumTrack.deleteMany();
    await db.subject.deleteMany();
    await db.board.deleteMany();
    await db.academicSession.deleteMany();
    await db.appUser.deleteMany();
    await db.student.deleteMany();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it("scopes published materials to the student's enrolled tracks/batches and honors filters", async () => {
    const db = prisma;

    const session = await db.academicSession.create({
      data: { name: "MAT Session", isActive: true },
    });
    const board = await db.board.create({ data: { code: "MATB", name: "MAT Board" } });
    const subjectX = await db.subject.create({ data: { code: "MATX", name: "Math X" } });
    const subjectXI = await db.subject.create({
      data: { code: "MATXI", name: "Math XI" },
    });

    const trackX = await db.curriculumTrack.create({
      data: {
        boardId: board.id,
        subjectId: subjectX.id,
        classLevel: "X" as ClassLevel,
        displayName: "Math X Track",
      },
    });
    const trackXI = await db.curriculumTrack.create({
      data: {
        boardId: board.id,
        subjectId: subjectXI.id,
        classLevel: "XI" as ClassLevel,
        displayName: "Math XI Track",
      },
    });

    const batchX = await db.batch.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: trackX.id,
        name: "MAT Batch X",
        isActive: true,
      },
    });
    const archivedBatch = await db.batch.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: trackX.id,
        name: "MAT Archived Batch",
        isActive: true,
        archivedAt: new Date(),
      },
    });

    const student = await db.student.create({
      data: { studentCode: "MAT-STU-001", fullName: "MAT Student" },
    });
    const appUser = await db.appUser.create({
      data: { role: Role.STUDENT, status: "ACTIVE", studentId: student.id },
    });
    await db.enrolment.create({
      data: {
        studentId: student.id,
        academicSessionId: session.id,
        curriculumTrackId: trackX.id,
        batchId: batchX.id,
        joiningDate: new Date(),
        status: "active",
      },
    });

    const mTrackX = await db.studyMaterial.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: trackX.id,
        title: "MAT Track X Doc",
        resourceType: "DOCUMENT" as StudyMaterialResourceType,
        visibility: "CURRICULUM_TRACK" as StudyMaterialVisibility,
        lifecycleState: "PUBLISHED" as StudyMaterialLifecycleState,
        publishedAt: new Date(),
      },
    });
    const mTrackXI = await db.studyMaterial.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: trackXI.id,
        title: "MAT Track XI Doc",
        resourceType: "DOCUMENT" as StudyMaterialResourceType,
        visibility: "CURRICULUM_TRACK" as StudyMaterialVisibility,
        lifecycleState: "PUBLISHED" as StudyMaterialLifecycleState,
        publishedAt: new Date(),
      },
    });
    const mBatchX = await db.studyMaterial.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: trackX.id,
        batchId: batchX.id,
        title: "MAT Batch X Link",
        resourceType: "LINK" as StudyMaterialResourceType,
        externalLinkUrl: "https://example.com/x",
        visibility: "BATCH" as StudyMaterialVisibility,
        lifecycleState: "PUBLISHED" as StudyMaterialLifecycleState,
        publishedAt: new Date(),
      },
    });
    await db.studyMaterial.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: trackX.id,
        title: "MAT Draft X",
        resourceType: "DOCUMENT" as StudyMaterialResourceType,
        visibility: "CURRICULUM_TRACK" as StudyMaterialVisibility,
        lifecycleState: "DRAFT" as StudyMaterialLifecycleState,
      },
    });
    await db.studyMaterial.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: trackX.id,
        batchId: archivedBatch.id,
        title: "MAT Archived Batch Doc",
        resourceType: "DOCUMENT" as StudyMaterialResourceType,
        visibility: "BATCH" as StudyMaterialVisibility,
        lifecycleState: "PUBLISHED" as StudyMaterialLifecycleState,
        publishedAt: new Date(),
      },
    });

    const base = await listStudentMaterials(appUser.id, {});
    expect(base.success).toBe(true);
    if (!base.success) return;
    expect(base.data.total).toBe(2);
    const ids = base.data.items.map((m) => m.id).sort();
    expect(ids).toEqual([mBatchX.id, mTrackX.id].sort());
    // Materials for non-enrolled tracks must not appear
    expect(ids).not.toContain(mTrackXI.id);

    // Resource type filter narrows to the single DOCUMENT (track X) material
    const byType = await listStudentMaterials(appUser.id, {
      resourceType: "DOCUMENT" as StudyMaterialResourceType,
    });
    expect(byType.success).toBe(true);
    if (!byType.success) return;
    expect(byType.data.total).toBe(1);
    expect(byType.data.items[0].id).toBe(mTrackX.id);

    // Class filter: XI yields nothing; X yields both
    const byXI = await listStudentMaterials(appUser.id, {
      classLevel: "XI" as ClassLevel,
    });
    expect(byXI.success).toBe(true);
    if (!byXI.success) return;
    expect(byXI.data.total).toBe(0);

    const byX = await listStudentMaterials(appUser.id, { classLevel: "X" as ClassLevel });
    expect(byX.success).toBe(true);
    if (!byX.success) return;
    expect(byX.data.total).toBe(2);

    // Unauthorized actors are rejected
    const noActor = await listStudentMaterials("non-existent-user", {});
    expect(noActor.success).toBe(false);
  });
});
