import { Pool } from "pg";
import * as crypto from "crypto";
import * as dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log("--- STARTING VERIFICATION ---");

  const boardCbseId = crypto.randomUUID();
  const boardCisceId = crypto.randomUUID();
  const progIcseId = crypto.randomUUID();
  const subjectMathId = crypto.randomUUID();

  // 1. Create a board & subject
  await pool.query(
    `INSERT INTO "Board" (id, code, name) VALUES ($1, 'CBSE_TEMP', 'CBSE')`,
    [boardCbseId],
  );
  await pool.query(
    `INSERT INTO "Board" (id, code, name) VALUES ($1, 'CISCE_TEMP', 'CISCE')`,
    [boardCisceId],
  );
  await pool.query(
    `INSERT INTO "Programme" (id, "boardId", code, name) VALUES ($1, $2, 'ICSE_TEMP', 'ICSE')`,
    [progIcseId, boardCisceId],
  );
  await pool.query(
    `INSERT INTO "Subject" (id, code, name) VALUES ($1, 'MATH_TEMP', 'Mathematics')`,
    [subjectMathId],
  );

  // Test 1: CBSE duplicate (programmeId = NULL)
  const trackCbse1Id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO "CurriculumTrack" (id, "boardId", "classLevel", "subjectId", "displayName") VALUES ($1, $2, 'X', $3, 'X Math CBSE')`,
    [trackCbse1Id, boardCbseId, subjectMathId],
  );
  console.log("Created CBSE track 1");

  try {
    const trackCbse2Id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO "CurriculumTrack" (id, "boardId", "classLevel", "subjectId", "displayName") VALUES ($1, $2, 'X', $3, 'X Math CBSE Duplicate')`,
      [trackCbse2Id, boardCbseId, subjectMathId],
    );
    console.error("FAILED: Allowed duplicate CBSE track!");
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === "23505") console.log("PASSED: Rejected duplicate CBSE track");
    else console.error("FAILED: Unexpected error on CBSE track", e);
  }

  // Test 2: CISCE duplicate
  const trackCisce1Id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO "CurriculumTrack" (id, "boardId", "programmeId", "classLevel", "subjectId", "displayName") VALUES ($1, $2, $3, 'X', $4, 'X Math ICSE')`,
    [trackCisce1Id, boardCisceId, progIcseId, subjectMathId],
  );
  console.log("Created CISCE track 1");

  try {
    const trackCisce2Id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO "CurriculumTrack" (id, "boardId", "programmeId", "classLevel", "subjectId", "displayName") VALUES ($1, $2, $3, 'X', $4, 'X Math ICSE Duplicate')`,
      [trackCisce2Id, boardCisceId, progIcseId, subjectMathId],
    );
    console.error("FAILED: Allowed duplicate CISCE track!");
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === "23505") console.log("PASSED: Rejected duplicate CISCE track");
    else console.error("FAILED: Unexpected error on CISCE track", e);
  }

  // Test 3: Distinct allowed
  try {
    const trackCisceDistinctId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO "CurriculumTrack" (id, "boardId", "programmeId", "classLevel", "subjectId", "displayName") VALUES ($1, $2, $3, 'IX', $4, 'IX Math ICSE Distinct')`,
      [trackCisceDistinctId, boardCisceId, progIcseId, subjectMathId],
    );
    console.log("PASSED: Allowed distinct valid track (Class IX)");
  } catch (err: unknown) {
    const e = err as { code?: string };
    console.error("FAILED: Rejected distinct valid track", e);
  }

  // Test 4: AcademicSession active constraint
  const session1Id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO "AcademicSession" (id, name, "isActive") VALUES ($1, '2026-27 TEMP', true)`,
    [session1Id],
  );
  console.log("Created active AcademicSession 1");

  try {
    const session2Id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO "AcademicSession" (id, name, "isActive") VALUES ($1, '2027-28 TEMP', true)`,
      [session2Id],
    );
    console.error("FAILED: Allowed second active AcademicSession!");
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === "23505") console.log("PASSED: Rejected second active AcademicSession");
    else console.error("FAILED: Unexpected error on AcademicSession", e);
  }

  // CLEANUP
  console.log("--- CLEANING UP TEMPORARY DATA ---");
  await pool.query(`DELETE FROM "AcademicSession" WHERE name LIKE '% TEMP'`);
  await pool.query(`DELETE FROM "CurriculumTrack" WHERE "displayName" LIKE '%Math%'`);
  await pool.query(`DELETE FROM "Programme" WHERE code = 'ICSE_TEMP'`);
  await pool.query(`DELETE FROM "Subject" WHERE code = 'MATH_TEMP'`);
  await pool.query(`DELETE FROM "Board" WHERE code IN ('CBSE_TEMP', 'CISCE_TEMP')`);

  console.log("Cleanup complete.");
  await pool.end();
}

main().catch(console.error);
