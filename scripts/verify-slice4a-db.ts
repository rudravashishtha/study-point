import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.test", override: true });

const testDbUrl =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL?.replace("/postgres?", "/test_study_point?");

if (!testDbUrl) {
  console.error("TEST_DATABASE_URL and DATABASE_URL are not set.");
  process.exit(1);
}

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
// 1. Deploy migration to test database
console.log("Resetting and migrating test database...");
execSync("npx prisma migrate reset --force", {
  env: { ...process.env, DATABASE_URL: testDbUrl },
  stdio: "inherit",
});

const pool = new Pool({ connectionString: testDbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runProofs() {
  console.log("Connected to test database. Running proofs...");

  // Cleanup
  await prisma.enrolment.deleteMany({});
  await prisma.batchSchedule.deleteMany({});
  await prisma.batch.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.curriculumTrack.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.board.deleteMany({});
  await prisma.academicSession.deleteMany({});

  const session = await prisma.academicSession.create({
    data: { name: "TEST-SESSION-2027", isActive: true },
  });

  const board = await prisma.board.create({ data: { code: "B-TEST", name: "Board" } });
  const subject = await prisma.subject.create({
    data: { code: "S-TEST", name: "Subject" },
  });

  const track = await prisma.curriculumTrack.create({
    data: {
      boardId: board.id,
      subjectId: subject.id,
      classLevel: "IX",
      displayName: "Track",
    },
  });

  const student = await prisma.student.create({
    data: { studentCode: "STU-TEST-1", fullName: "Test Student" },
  });

  // Proof 1: Batch Name uniqueness where archivedAt IS NULL
  console.log("\nProof 1: Batch Name uniqueness");
  const batchA = await prisma.batch.create({
    data: {
      academicSessionId: session.id,
      curriculumTrackId: track.id,
      name: "Batch A",
    },
  });

  try {
    await prisma.batch.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        name: "Batch A",
      },
    });
    console.error("❌ FAILED: Duplicate active Batch name was allowed.");
  } catch (err: any) {
    if (err.code === "P2002") {
      console.log("✅ Caught P2002 for Duplicate active Batch.");
      console.log("   Constraint Identity:", err.meta?.target);
      console.log(
        "   Driver Cause Message:",
        err.meta?.driverAdapterError?.cause?.originalMessage || err.message,
      );
    } else {
      console.error("❌ FAILED: Unexpected error", err);
    }
  }

  // Archive Batch A, should be able to create another Batch A
  await prisma.batch.update({
    where: { id: batchA.id },
    data: { archivedAt: new Date() },
  });

  const batchA2 = await prisma.batch.create({
    data: {
      academicSessionId: session.id,
      curriculumTrackId: track.id,
      name: "Batch A",
    },
  });
  console.log("✅ Successfully created second 'Batch A' because the first is archived.");

  try {
    // Attempting to restore Batch A should collide with Batch A2
    await prisma.batch.update({
      where: { id: batchA.id },
      data: { archivedAt: null },
    });
    console.error("❌ FAILED: Restoring archived Batch A bypassed duplicate check.");
  } catch (err: any) {
    if (err.code === "P2002") {
      console.log("✅ Caught P2002 on Restoring Batch A (collides with active).");
      console.log("   Constraint Identity:", err.meta?.target);
    } else {
      console.error("❌ FAILED: Unexpected error", err);
    }
  }

  // Proof 2: Enrolment uniqueness where archivedAt IS NULL
  console.log("\nProof 2: Enrolment uniqueness");
  const enrolmentA = await prisma.enrolment.create({
    data: {
      studentId: student.id,
      academicSessionId: session.id,
      curriculumTrackId: track.id,
      joiningDate: new Date("2026-07-01T00:00:00.000Z"),
    },
  });

  try {
    await prisma.enrolment.create({
      data: {
        studentId: student.id,
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        joiningDate: new Date("2026-07-01T00:00:00.000Z"),
      },
    });
    console.error("❌ FAILED: Duplicate active Enrolment was allowed.");
  } catch (err: any) {
    if (err.code === "P2002") {
      console.log("✅ Caught P2002 for Duplicate active Enrolment.");
      console.log("   Constraint Identity:", err.meta?.target);
      console.log(
        "   Driver Cause Message:",
        err.meta?.driverAdapterError?.cause?.originalMessage || err.message,
      );
    } else {
      console.error("❌ FAILED: Unexpected error", err);
    }
  }

  // Archive enrolment A, should be able to create another for same student/session/track
  await prisma.enrolment.update({
    where: { id: enrolmentA.id },
    data: { archivedAt: new Date() },
  });

  await prisma.enrolment.create({
    data: {
      studentId: student.id,
      academicSessionId: session.id,
      curriculumTrackId: track.id,
      joiningDate: new Date("2026-07-01T00:00:00.000Z"),
    },
  });
  console.log("✅ Successfully created second Enrolment because the first is archived.");

  try {
    // Attempting to restore Enrolment A should collide with the new one
    await prisma.enrolment.update({
      where: { id: enrolmentA.id },
      data: { archivedAt: null },
    });
    console.error("❌ FAILED: Restoring archived Enrolment A bypassed duplicate check.");
  } catch (err: any) {
    if (err.code === "P2002") {
      console.log("✅ Caught P2002 on Restoring Enrolment A (collides with active).");
      console.log("   Constraint Identity:", err.meta?.target);
    } else {
      console.error("❌ FAILED: Unexpected error", err);
    }
  }

  // Check the list of partial indexes in pg_indexes
  console.log("\nChecking pg_indexes to ensure no partial indexes were dropped:");
  const indexes: any[] = await prisma.$queryRaw`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename IN ('AcademicSession', 'CurriculumTrack', 'Batch', 'Enrolment') 
    AND indexdef LIKE '%WHERE%'
  `;
  console.log(indexes);
}

runProofs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
