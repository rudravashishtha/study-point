import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

import * as util from "util";
import { PrismaPg } from "@prisma/adapter-pg";
import { extractPrismaConstraintName } from "../src/lib/db/errors";

async function main() {
  const connectionString = process.env.TEST_DATABASE_URL;
  if (!connectionString) {
    throw new Error("TEST_DATABASE_URL not set");
  }

  // Need SSL rejectUnauthorized false due to local config
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Testing P2002 shape via PrismaPg...");

  try {
    const tId = "teacher-p2002";
    const bId = "batch-p2002";
    const sId = "sess-p2002";
    const ctId = "ct-p2002";
    const boardId = "board-p2002";
    const subjId = "subj-p2002";

    // Cleanup first just in case
    await prisma.$executeRawUnsafe(
      `DELETE FROM "TeacherAssignment" WHERE "teacherId" = $1`,
      tId,
    );
    await prisma.$executeRawUnsafe(`DELETE FROM "Batch" WHERE "id" = $1`, bId);
    await prisma.$executeRawUnsafe(`DELETE FROM "Teacher" WHERE "id" = $1`, tId);
    await prisma.$executeRawUnsafe(`DELETE FROM "CurriculumTrack" WHERE "id" = $1`, ctId);
    await prisma.$executeRawUnsafe(`DELETE FROM "AcademicSession" WHERE "id" = $1`, sId);
    await prisma.$executeRawUnsafe(`DELETE FROM "Subject" WHERE "id" = $1`, subjId);
    await prisma.$executeRawUnsafe(`DELETE FROM "Board" WHERE "id" = $1`, boardId);

    // Insert dependencies
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Board" ("id", "code", "name", "updatedAt") VALUES ($1, 'BP2', 'Board P2', NOW())`,
      boardId,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Subject" ("id", "code", "name", "updatedAt") VALUES ($1, 'SP2', 'Subj P2', NOW())`,
      subjId,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "AcademicSession" ("id", "name", "updatedAt") VALUES ($1, 'Dummy Session P2', NOW())`,
      sId,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "CurriculumTrack" ("id", "boardId", "subjectId", "classLevel", "displayName", "updatedAt") VALUES ($1, $2, $3, 'X', 'Dummy Track P2', NOW())`,
      ctId,
      boardId,
      subjId,
    );

    await prisma.$executeRawUnsafe(
      `INSERT INTO "Teacher" ("id", "displayName", "active") VALUES ($1, 'Dummy Teacher', true)`,
      tId,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Batch" ("id", "academicSessionId", "curriculumTrackId", "name", "updatedAt") VALUES ($1, $2, $3, 'Dummy Batch', NOW())`,
      bId,
      sId,
      ctId,
    );

    // Insert 1
    await prisma.teacherAssignment.create({
      data: {
        teacherId: tId,
        batchId: bId,
        permissions: [],
      },
    });

    // Insert 2 to trigger duplicate
    await prisma.teacherAssignment.create({
      data: {
        teacherId: tId,
        batchId: bId,
        permissions: [],
      },
    });

    console.log("FAIL: Expected P2002 error, but insert succeeded");
  } catch (error: unknown) {
    console.log("--- RAW FULL ERROR DUMP ---");
    console.log(util.inspect(error, { depth: null, colors: true }));

    const e = error as {
      code?: string;
      message?: string;
      meta?: {
        target?: string;
        driverAdapterError?: {
          cause?: {
            originalCode?: string;
            originalMessage?: string;
            kind?: string;
            constraint?: string;
          };
        };
      };
    };
    const driverCause = e.meta?.driverAdapterError?.cause;
    console.log("\n--- EXTRACTED RAW FIELDS ---");
    console.log("error.code:", e.code);
    console.log("error.meta.target:", e.meta?.target);
    console.log(
      "error.meta.driverAdapterError.cause.originalCode:",
      driverCause?.originalCode,
    );
    console.log(
      "error.meta.driverAdapterError.cause.originalMessage:",
      driverCause?.originalMessage,
    );
    console.log("error.meta.driverAdapterError.cause.kind:", driverCause?.kind);
    console.log(
      "error.meta.driverAdapterError.cause.constraint:",
      driverCause?.constraint,
    );

    console.log("\n--- EXTRACTOR RESULT ---");
    console.log("extractPrismaConstraintName():", extractPrismaConstraintName(error));
  } finally {
    await prisma.$disconnect();
    await pool.end(); // close pool to let script exit
  }
}

main().catch(console.error);
