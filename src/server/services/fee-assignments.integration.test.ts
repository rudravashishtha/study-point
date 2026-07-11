import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { PrismaClient, Role, FeeAssignmentStatus } from "@prisma/client";

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

import {
  initializeTestDb,
  teardownTestDb,
  isTestConfigured,
} from "@/lib/test/db-isolation";
import {
  previewFeeAssignment,
  confirmFeeAssignment,
  archiveFeeAssignment,
  restoreFeeAssignment,
  getAssignment,
  listStudentFeeDues,
} from "./fee-assignments";
import { ActorContext } from "@/lib/domain/actor";

const prisma = testDbProxy as PrismaClient;

describe.skipIf(!isTestConfigured)("Fee Assignment Service Integration", () => {
  beforeAll(async () => {
    await initializeTestDb();

    const db = testDbProxy as PrismaClient;
    await db.studentFeeDue.deleteMany();
    await db.studentFeeAssignment.deleteMany();
    await db.feePlanInstallment.deleteMany();
    await db.feePlan.deleteMany();
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
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  // ── Shared fixtures ──────────────────────────────────────────────
  const db = prisma;

  let admin: any;
  let studentUser1: any;
  let studentUser2: any;
  let studentUser3: any;
  let student1: any;
  let student2: any;
  let student3: any;
  let enrolmentA: any;
  let enrolmentB: any;
  let enrolmentC: any; // archived
  let session: any;
  let batch: any;
  let feePlan: any; // active, 3 installments
  let archivedFeePlan: any; // archived

  const adminActor: ActorContext = {
    userId: "",
    role: "ADMIN",
    metadata: { role: "ADMIN", status: "ACTIVE" },
  };
  const studentActor1: ActorContext = {
    userId: "",
    role: "STUDENT",
    metadata: { role: "STUDENT", status: "ACTIVE" },
  };

  beforeAll(async () => {
    admin = await db.appUser.create({ data: { role: Role.ADMIN, status: "ACTIVE" } });
    adminActor.userId = admin.id;

    studentUser1 = await db.appUser.create({
      data: { role: Role.STUDENT, status: "ACTIVE" },
    });
    studentUser2 = await db.appUser.create({
      data: { role: Role.STUDENT, status: "ACTIVE" },
    });
    studentUser3 = await db.appUser.create({
      data: { role: Role.STUDENT, status: "ACTIVE" },
    });
    studentActor1.userId = studentUser1.id;

    student1 = await db.student.create({
      data: { studentCode: "FEESTU01", fullName: "Fee Student One" },
    });
    student2 = await db.student.create({
      data: { studentCode: "FEESTU02", fullName: "Fee Student Two" },
    });
    student3 = await db.student.create({
      data: { studentCode: "FEESTU03", fullName: "Fee Student Three" },
    });

    await db.appUser.update({
      where: { id: studentUser1.id },
      data: { studentId: student1.id },
    });
    await db.appUser.update({
      where: { id: studentUser2.id },
      data: { studentId: student2.id },
    });
    await db.appUser.update({
      where: { id: studentUser3.id },
      data: { studentId: student3.id },
    });

    session = await db.academicSession.create({
      data: { name: "Fee Test Session", isActive: true },
    });
    const board = await db.board.create({
      data: { code: "FEEBOARD", name: "Fee Board" },
    });
    const subject = await db.subject.create({
      data: { code: "FEEMATH", name: "Fee Math" },
    });
    const track = await db.curriculumTrack.create({
      data: {
        boardId: board.id,
        subjectId: subject.id,
        classLevel: "X",
        displayName: "Fee Track",
      },
    });
    batch = await db.batch.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        name: "Fee Batch",
        isActive: true,
      },
    });

    enrolmentA = await db.enrolment.create({
      data: {
        studentId: student1.id,
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        batchId: batch.id,
        joiningDate: new Date(),
        status: "active",
      },
    });
    enrolmentB = await db.enrolment.create({
      data: {
        studentId: student2.id,
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        batchId: batch.id,
        joiningDate: new Date(),
        status: "active",
      },
    });
    enrolmentC = await db.enrolment.create({
      data: {
        studentId: student3.id,
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        batchId: batch.id,
        joiningDate: new Date(),
        status: "active",
        archivedAt: new Date(),
      },
    });

    feePlan = await db.feePlan.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        name: "Class X Annual",
        totalAmount: new (await import("@prisma/client")).Prisma.Decimal(30000),
        frequency: "CUSTOM",
        isActive: true,
      },
      include: { instalments: true },
    });
    await db.feePlanInstallment.createMany({
      data: [
        {
          feePlanId: feePlan.id,
          label: "Term 1",
          dueOffsetDays: 0,
          amount: new (await import("@prisma/client")).Prisma.Decimal(10000),
          displayOrder: 0,
        },
        {
          feePlanId: feePlan.id,
          label: "Term 2",
          dueOffsetDays: 90,
          amount: new (await import("@prisma/client")).Prisma.Decimal(10000),
          displayOrder: 1,
        },
        {
          feePlanId: feePlan.id,
          label: "Term 3",
          dueOffsetDays: 180,
          amount: new (await import("@prisma/client")).Prisma.Decimal(10000),
          displayOrder: 2,
        },
      ],
    });
    feePlan = await db.feePlan.findUnique({
      where: { id: feePlan.id },
      include: { instalments: { orderBy: { displayOrder: "asc" } } },
    });

    archivedFeePlan = await db.feePlan.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        name: "Archived Plan",
        totalAmount: new (await import("@prisma/client")).Prisma.Decimal(5000),
        frequency: "MONTHLY",
        isActive: true,
        archivedAt: new Date(),
      },
    });
    await db.feePlanInstallment.create({
      data: {
        feePlanId: archivedFeePlan.id,
        label: "Only",
        dueOffsetDays: 0,
        amount: new (await import("@prisma/client")).Prisma.Decimal(5000),
        displayOrder: 0,
      },
    });
  });

  // Clean assignments between tests so each scenario is isolated.
  beforeEach(async () => {
    await db.studentFeeDue.deleteMany();
    await db.studentFeeAssignment.deleteMany();
  });

  const input = (enrolmentIds: string[], startsOn = "2026-08-01") => ({
    feePlanId: feePlan.id,
    enrolmentIds,
    startsOn,
    endsOn: null,
  });

  // ── 1. Preview generation ───────────────────────────────────────
  it("1. preview generates proposed dues for valid enrolments", async () => {
    const res = await previewFeeAssignment(
      adminActor,
      input([enrolmentA.id, enrolmentB.id]),
    );
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.items.length).toBe(2);
    expect(res.data.items.every((i) => i.valid)).toBe(true);
    expect(res.data.totals.valid).toBe(2);
  });

  // ── 2. No preview mutations ─────────────────────────────────────
  it("2. preview does not mutate the database", async () => {
    const before = await db.studentFeeAssignment.count();
    const beforeDues = await db.studentFeeDue.count();
    const res = await previewFeeAssignment(adminActor, input([enrolmentA.id]));
    expect(res.success).toBe(true);
    const after = await db.studentFeeAssignment.count();
    const afterDues = await db.studentFeeDue.count();
    expect(after).toBe(before);
    expect(afterDues).toBe(beforeDues);
  });

  // ── 3. Correct installment expansion ────────────────────────────
  it("3. preview expands all fee plan installments into proposed dues", async () => {
    const res = await previewFeeAssignment(adminActor, input([enrolmentA.id]));
    expect(res.success).toBe(true);
    if (!res.success) return;
    const item = res.data.items[0];
    expect(item.proposedDues.length).toBe(3);
    expect(item.proposedDues.map((d) => d.label).sort()).toEqual([
      "Term 1",
      "Term 2",
      "Term 3",
    ]);
  });

  // ── 4. Correct assigned total ───────────────────────────────────
  it("4. preview assigned total equals installment total", async () => {
    const res = await previewFeeAssignment(adminActor, input([enrolmentA.id]));
    expect(res.success).toBe(true);
    if (!res.success) return;
    const sum = feePlan.instalments.reduce(
      (s: number, i: any) => s + i.amount.toNumber(),
      0,
    );
    expect(res.data.totals.totalAmount).toBe(sum);
    expect(sum).toBe(30000);
  });

  // ── 5. Duplicate active assignment detection ────────────────────
  it("5. preview flags existing active assignments as duplicates", async () => {
    const confirm = await confirmFeeAssignment(adminActor, input([enrolmentA.id]));
    expect(confirm.success).toBe(true);

    const res = await previewFeeAssignment(adminActor, input([enrolmentA.id]));
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.items[0].hasExistingActiveAssignment).toBe(true);
    expect(res.data.items[0].valid).toBe(false);
    expect(res.data.totals.duplicates).toBe(1);
  });

  // ── 6. Serializable confirm (concurrent idempotency) ────────────
  it("6. concurrent confirms never create duplicate active assignments", async () => {
    const [r1, r2] = await Promise.all([
      confirmFeeAssignment(adminActor, input([enrolmentA.id])),
      confirmFeeAssignment(adminActor, input([enrolmentA.id])),
    ]);
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);

    const count = await db.studentFeeAssignment.count({
      where: { enrolmentId: enrolmentA.id, status: "ACTIVE", archivedAt: null },
    });
    expect(count).toBe(1);
  });

  // ── 7. Partial success ──────────────────────────────────────────
  it("7. confirm continues past a failing enrolment (partial success)", async () => {
    const res = await confirmFeeAssignment(
      adminActor,
      input([enrolmentA.id, "non-existent-id", enrolmentB.id]),
    );
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.created).toBe(2);
    expect(res.data.failed).toBe(1);

    const a = res.data.items.find((i) => i.enrolmentId === enrolmentA.id);
    const b = res.data.items.find((i) => i.enrolmentId === enrolmentB.id);
    const bad = res.data.items.find((i) => i.enrolmentId === "non-existent-id");
    expect(a?.status).toBe("created");
    expect(b?.status).toBe("created");
    expect(bad?.status).toBe("failed");
  });

  // ── 8. Idempotent confirm ───────────────────────────────────────
  it("8. confirm is idempotent (re-run skips existing)", async () => {
    const first = await confirmFeeAssignment(
      adminActor,
      input([enrolmentA.id, enrolmentB.id]),
    );
    expect(first.success).toBe(true);
    if (first.success) expect(first.data.created).toBe(2);

    const second = await confirmFeeAssignment(
      adminActor,
      input([enrolmentA.id, enrolmentB.id]),
    );
    expect(second.success).toBe(true);
    if (second.success) {
      expect(second.data.created).toBe(0);
      expect(second.data.skipped).toBe(2);
    }

    const count = await db.studentFeeAssignment.count({ where: { archivedAt: null } });
    expect(count).toBe(2);
  });

  // ── 9. Archive behavior ─────────────────────────────────────────
  it("9. archive soft-archives assignment and keeps dues", async () => {
    const confirm = await confirmFeeAssignment(adminActor, input([enrolmentA.id]));
    expect(confirm.success).toBe(true);
    if (!confirm.success) return;
    const assignmentId = confirm.data.items[0].assignmentId!;

    const dueCountBefore = await db.studentFeeDue.count({
      where: { feeAssignmentId: assignmentId },
    });
    expect(dueCountBefore).toBe(3);

    const archive = await archiveFeeAssignment(adminActor, assignmentId);
    expect(archive.success).toBe(true);

    const reloaded = await db.studentFeeAssignment.findUnique({
      where: { id: assignmentId },
    });
    expect(reloaded?.archivedAt).not.toBeNull();
    const dueCountAfter = await db.studentFeeDue.count({
      where: { feeAssignmentId: assignmentId },
    });
    expect(dueCountAfter).toBe(3);
  });

  // ── 10. Restore success ─────────────────────────────────────────
  it("10. restore clears archive state", async () => {
    const confirm = await confirmFeeAssignment(adminActor, input([enrolmentA.id]));
    if (!confirm.success) return;
    const assignmentId = confirm.data.items[0].assignmentId!;
    await archiveFeeAssignment(adminActor, assignmentId);

    const restore = await restoreFeeAssignment(adminActor, assignmentId);
    expect(restore.success).toBe(true);
    const reloaded = await db.studentFeeAssignment.findUnique({
      where: { id: assignmentId },
    });
    expect(reloaded?.archivedAt).toBeNull();
  });

  // ── 11. Restore duplicate rejection ─────────────────────────────
  it("11. restore is rejected when another active assignment exists", async () => {
    const confirm = await confirmFeeAssignment(adminActor, input([enrolmentA.id]));
    if (!confirm.success) return;
    const assignmentId = confirm.data.items[0].assignmentId!;
    await archiveFeeAssignment(adminActor, assignmentId);

    // Create a second active assignment for the same enrolment+plan (simulate conflict)
    const conflict = await db.studentFeeAssignment.create({
      data: {
        enrolmentId: enrolmentA.id,
        feePlanId: feePlan.id,
        assignedTotalAmount: new (await import("@prisma/client")).Prisma.Decimal(30000),
        startsOn: new Date("2026-08-01T00:00:00.000Z"),
        status: "ACTIVE",
      },
    });

    const restore = await restoreFeeAssignment(adminActor, assignmentId);
    expect(restore.success).toBe(false);
    if (!restore.success) expect(restore.error.code).toBe("DUPLICATE_IDENTITY");

    await db.studentFeeAssignment.delete({ where: { id: conflict.id } });
  });

  // ── 12. Student visibility ──────────────────────────────────────
  it("12. student can view only their own fee dues", async () => {
    await confirmFeeAssignment(adminActor, input([enrolmentA.id, enrolmentB.id]));

    const own = await listStudentFeeDues(studentActor1);
    expect(own.success).toBe(true);
    if (!own.success) return;
    expect(own.data.assignments.length).toBe(1);
    expect(own.data.assignments[0].enrolmentId).toBe(enrolmentA.id);
  });

  // ── 13. Archived hidden ─────────────────────────────────────────
  it("13. archived assignments are hidden from student view", async () => {
    const confirm = await confirmFeeAssignment(adminActor, input([enrolmentA.id]));
    if (!confirm.success) return;
    const assignmentId = confirm.data.items[0].assignmentId!;
    await archiveFeeAssignment(adminActor, assignmentId);

    const own = await listStudentFeeDues(studentActor1);
    expect(own.success).toBe(true);
    if (!own.success) return;
    expect(own.data.assignments.length).toBe(0);
  });

  // ── 14. Due ordering ────────────────────────────────────────────
  it("14. dues are ordered by dueDate ascending", async () => {
    await confirmFeeAssignment(adminActor, input([enrolmentA.id]));
    const own = await listStudentFeeDues(studentActor1);
    expect(own.success).toBe(true);
    if (!own.success) return;
    const dues = own.data.assignments[0].dues;
    for (let i = 1; i < dues.length; i++) {
      expect(new Date(dues[i].dueDate).getTime()).toBeGreaterThanOrEqual(
        new Date(dues[i - 1].dueDate).getTime(),
      );
    }
  });

  // ── 15. amountWaived defaults ───────────────────────────────────
  it("15. generated dues default amountWaived to 0", async () => {
    await confirmFeeAssignment(adminActor, input([enrolmentA.id]));
    const dues = await db.studentFeeDue.findMany({
      where: {
        amountWaived: { not: new (await import("@prisma/client")).Prisma.Decimal(0) },
      },
    });
    expect(dues.length).toBe(0);
    const all = await db.studentFeeDue.findMany();
    expect(all.every((d: any) => d.amountWaived.toNumber() === 0)).toBe(true);
  });

  // ── 16. Status defaults ─────────────────────────────────────────
  it("16. assignment status ACTIVE and due status PENDING by default", async () => {
    const confirm = await confirmFeeAssignment(adminActor, input([enrolmentA.id]));
    expect(confirm.success).toBe(true);
    if (!confirm.success) return;
    const assignmentId = confirm.data.items[0].assignmentId!;
    const assignment = await db.studentFeeAssignment.findUnique({
      where: { id: assignmentId },
    });
    expect(assignment?.status).toBe<FeeAssignmentStatus>("ACTIVE");
    const dues = await db.studentFeeDue.findMany({
      where: { feeAssignmentId: assignmentId },
    });
    expect(dues.every((d: any) => d.status === "PENDING")).toBe(true);
  });

  // ── 17. Audit log creation ──────────────────────────────────────
  it("17. confirm writes an audit log entry", async () => {
    await confirmFeeAssignment(adminActor, input([enrolmentA.id]));
    const logs = await db.auditLog.findMany({
      where: { action: "FEE_ASSIGNMENT_CREATE" },
    });
    expect(logs.length).toBeGreaterThanOrEqual(1);
  });

  // ── 18. Batch/session derivation ────────────────────────────────
  it("18. assignment enrolment resolves to batch and session", async () => {
    const confirm = await confirmFeeAssignment(adminActor, input([enrolmentA.id]));
    expect(confirm.success).toBe(true);
    if (!confirm.success) return;
    const assignmentId = confirm.data.items[0].assignmentId!;
    const detail = await getAssignment(adminActor, assignmentId);
    expect(detail.success).toBe(true);
    if (!detail.success) return;
    expect(detail.data.enrolment.batch).not.toBeNull();
    expect(detail.data.enrolment.academicSession).not.toBeNull();
    expect(detail.data.enrolment.academicSession!.id).toBe(session.id);
    expect(detail.data.enrolment.batch!.id).toBe(batch.id);
  });

  // ── 19. Invalid enrolment rejection ─────────────────────────────
  it("19. invalid (archived/non-existent) enrolment is rejected per item", async () => {
    const res = await confirmFeeAssignment(
      adminActor,
      input([enrolmentA.id, enrolmentC.id, "ghost"]),
    );
    expect(res.success).toBe(true);
    if (!res.success) return;
    const valid = res.data.items.find((i) => i.enrolmentId === enrolmentA.id);
    const archived = res.data.items.find((i) => i.enrolmentId === enrolmentC.id);
    const ghost = res.data.items.find((i) => i.enrolmentId === "ghost");
    expect(valid?.status).toBe("created");
    expect(archived?.status).toBe("failed");
    expect(ghost?.status).toBe("failed");
  });

  // ── 20. Archived FeePlan rejection ──────────────────────────────
  it("20. confirm with an archived fee plan is rejected", async () => {
    const res = await confirmFeeAssignment(adminActor, {
      feePlanId: archivedFeePlan.id,
      enrolmentIds: [enrolmentA.id],
      startsOn: "2026-08-01",
      endsOn: null,
    });
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.code).toBe("INVALID_RELATION");
  });

  // ── Authorization ───────────────────────────────────────────────
  it("21. non-admin cannot preview; non-student cannot list dues", async () => {
    const studentActor: ActorContext = {
      userId: studentUser1.id,
      role: "STUDENT",
      metadata: { role: "STUDENT", status: "ACTIVE" },
    };
    const adminPreview = await previewFeeAssignment(studentActor, input([enrolmentA.id]));
    expect(adminPreview.success).toBe(false);

    const adminListDues = await listStudentFeeDues(adminActor);
    expect(adminListDues.success).toBe(false);
  });
});
