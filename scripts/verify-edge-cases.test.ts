import { it, vi } from "vitest";
import { db as prisma } from "../src/lib/db";
import {
  setupIsolatedTestDb,
  initializeTestDb,
  isTestConfigured,
} from "../src/lib/test/db-isolation";
import {
  createBatch,
  updateBatch,
  archiveBatch,
  restoreBatch,
} from "../src/server/services/batches";
import {
  createEnrolment,
  updateEnrolment,
  archiveEnrolment,
  restoreEnrolment,
  removeFromBatch,
} from "../src/server/services/enrolments";

vi.mock("../src/lib/db", () => ({
  get db() {
    return (globalThis as unknown as Record<string, unknown>).__testDb;
  },
}));

setupIsolatedTestDb();

it("verifies edge cases", async () => {
  if (!isTestConfigured) return;
  await initializeTestDb();

  await prisma.enrolment.deleteMany({
    where: { student: { studentCode: { in: ["VS1", "VS2", "DUP_S1"] } } },
  });
  await prisma.student.deleteMany({
    where: { studentCode: { in: ["VS1", "VS2", "DUP_S1"] } },
  });
  await prisma.batch.deleteMany({
    where: { name: { in: ["V_Batch_1", "V_Batch_1_Updated", "DUP_BATCH"] } },
  });

  // Setup data
  let session = await prisma.academicSession.findFirst();
  if (!session)
    session = await prisma.academicSession.create({
      data: {
        name: "V_Session",
        startsOn: new Date(),
        endsOn: new Date(),
        isActive: true,
      },
    });

  let board = await prisma.board.findFirst();
  if (!board)
    board = await prisma.board.create({ data: { name: "V_Board", code: "VB" } });

  let subject = await prisma.subject.findFirst();
  if (!subject)
    subject = await prisma.subject.create({ data: { name: "V_Subject", code: "VS" } });

  let track = await prisma.curriculumTrack.findFirst({
    where: { boardId: board.id, subjectId: subject.id, classLevel: "X" },
  });
  if (!track)
    track = await prisma.curriculumTrack.create({
      data: {
        boardId: board.id,
        subjectId: subject.id,
        classLevel: "X",
        displayName: "V_Track",
      },
    });

  const student1 = await prisma.student.create({
    data: { fullName: "V_Student 1", studentCode: "VS1" },
  });
  const student2 = await prisma.student.create({
    data: { fullName: "V_Student 2", studentCode: "VS2" },
  });

  console.log("--- BATCH EDGE CASES ---");
  const batchRes1 = await createBatch({
    academicSessionId: session.id,
    curriculumTrackId: track.id,
    name: "V_Batch_1",
    capacity: 2,
    schedules: [],
  });
  if (!batchRes1.success) throw new Error("FAIL");
  const b1 = batchRes1.data;

  await archiveBatch(b1.id);

  const updRes = await updateBatch(b1.id, { name: "V_Batch_1_Updated" });
  console.log(
    `1. Batch update when archived: ${updRes.success ? "FAIL" : updRes.error?.code}`,
  );

  const archRes = await archiveBatch(b1.id);
  console.log(
    `2. Batch archive when already archived: ${archRes.success ? "FAIL" : archRes.error?.code}`,
  );

  await restoreBatch(b1.id);
  const auditCountBefore = await prisma.auditLog.count({ where: { entityId: b1.id } });
  await restoreBatch(b1.id);
  const auditCountAfter = await prisma.auditLog.count({ where: { entityId: b1.id } });
  console.log(
    `3. Batch restore when already restored: diff=${auditCountAfter - auditCountBefore}`,
  );

  const enrRes1 = await createEnrolment({
    studentId: student1.id,
    academicSessionId: session.id,
    curriculumTrackId: track.id,
    batchId: b1.id,
    joiningDate: new Date(),
  });
  if (!enrRes1.success) throw new Error("FAIL");
  const e1 = enrRes1.data;
  const blockedArch = await archiveBatch(b1.id);
  console.log(
    `4. Batch archive blocked by Enrolment: ${blockedArch.success ? "FAIL" : blockedArch.error?.code}`,
  );

  await archiveEnrolment(e1.id);
  await archiveBatch(b1.id);
  const batchRes2 = await createBatch({
    academicSessionId: session.id,
    curriculumTrackId: track.id,
    name: "V_Batch_1",
    capacity: 2,
    schedules: [],
  });
  if (!batchRes2.success) throw new Error("FAIL");
  const collisionRestore = await restoreBatch(b1.id);
  console.log(
    `5. Batch restore collision: ${collisionRestore.success ? "FAIL" : collisionRestore.error?.code}`,
  );

  console.log("--- ENROLMENT EDGE CASES ---");
  const enrRes2 = await createEnrolment({
    studentId: student2.id,
    academicSessionId: session.id,
    curriculumTrackId: track.id,
    joiningDate: new Date(),
  });
  if (!enrRes2.success) throw new Error("FAIL");
  const e2 = enrRes2.data;

  await archiveEnrolment(e2.id);

  const eUpd = await updateEnrolment(e2.id, { status: "suspended" });
  console.log(
    `6. Enrolment update when archived: ${eUpd.success ? "FAIL" : eUpd.error?.code}`,
  );

  const eArch = await archiveEnrolment(e2.id);
  console.log(
    `7. Enrolment archive when already archived: ${eArch.success ? "FAIL" : eArch.error?.code}`,
  );

  await restoreEnrolment(e2.id);
  const eAuditCount1 = await prisma.auditLog.count({ where: { entityId: e2.id } });
  await restoreEnrolment(e2.id);
  const eAuditCount2 = await prisma.auditLog.count({ where: { entityId: e2.id } });
  console.log(
    `8. Enrolment restore when already restored: diff=${eAuditCount2 - eAuditCount1}`,
  );

  const rAuditCount1 = await prisma.auditLog.count({ where: { entityId: e2.id } });
  await removeFromBatch(e2.id);
  const rAuditCount2 = await prisma.auditLog.count({ where: { entityId: e2.id } });
  console.log(`9. removeFromBatch when unassigned: diff=${rAuditCount2 - rAuditCount1}`);

  await archiveEnrolment(e2.id);
  await createEnrolment({
    studentId: student2.id,
    academicSessionId: session.id,
    curriculumTrackId: track.id,
    joiningDate: new Date(),
  });
  const eRestoreColl = await restoreEnrolment(e2.id);
  console.log(
    `10. Enrolment restore collision: ${eRestoreColl.success ? "FAIL" : eRestoreColl.error?.code}`,
  );

  // Cleanup
  await prisma.enrolment.deleteMany({
    where: { studentId: { in: [student1.id, student2.id] } },
  });
  await prisma.batch.deleteMany({ where: { id: { in: [b1.id, batchRes2.data!.id] } } });
  await prisma.student.deleteMany({ where: { id: { in: [student1.id, student2.id] } } });
}, 30000);
