import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config(); // Load default .env

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const mode = process.argv[2]; // "pre" or "post"

  if (mode === "pre") {
    console.log("--- PRE-MIGRATION PROOF (DEV DB) ---");
    const countRes = await pool.query(
      `SELECT COUNT(*) AS source_teacher_links FROM "Batch" WHERE "teacherId" IS NOT NULL`,
    );
    console.log("Source teacher links in Batch:", countRes.rows[0].source_teacher_links);

    const legacyMappings = await pool.query(
      `SELECT "id" AS "batchId", "teacherId" FROM "Batch" WHERE "teacherId" IS NOT NULL ORDER BY "id"`,
    );
    console.log("Legacy Mappings:", legacyMappings.rows);

    const indexes = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename IN ('AcademicSession', 'CurriculumTrack', 'Batch', 'Enrolment', 'TeacherAssignment')
        AND indexname IN (
          'AcademicSession_isActive_key',
          'CurriculumTrack_board_class_subject_null_prog_key',
          'CurriculumTrack_board_prog_class_subject_key',
          'Batch_session_track_name_key',
          'Enrolment_student_session_track_key'
        )
    `);
    console.log("Pre-migration indexes:");
    indexes.rows.forEach((i: any) => console.log(i.indexname, "->", i.indexdef));
  } else if (mode === "post") {
    console.log("--- POST-MIGRATION PROOF (DEV DB) ---");

    // 1. Batch.teacherId gone
    try {
      await pool.query(`SELECT "teacherId" FROM "Batch" LIMIT 1`);
      console.log("1. Batch.teacherId STILL EXISTS (FAIL)");
    } catch (e: any) {
      console.log("1. Batch.teacherId check:", e.message);
    }

    // 2. 5 protected indexes
    const indexes2 = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename IN ('AcademicSession', 'CurriculumTrack', 'Batch', 'Enrolment', 'TeacherAssignment')
        AND indexname IN (
          'AcademicSession_isActive_key',
          'CurriculumTrack_board_class_subject_null_prog_key',
          'CurriculumTrack_board_prog_class_subject_key',
          'Batch_session_track_name_key',
          'Enrolment_student_session_track_key'
        )
    `);
    console.log("2. Post-migration protected indexes:");
    indexes2.rows.forEach((i: any) => console.log(i.indexname, "->", i.indexdef));

    // 3. TeacherAssignment_teacher_batch_key
    const taIndex = await pool.query(
      `SELECT indexdef FROM pg_indexes WHERE indexname = 'TeacherAssignment_teacher_batch_key'`,
    );
    console.log("3. TeacherAssignment_teacher_batch_key:", taIndex.rows[0]?.indexdef);

    // 4. Foreign keys
    const fks = await pool.query(`
      SELECT tc.constraint_name, rc.update_rule, rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
      WHERE tc.table_name = 'TeacherAssignment'
    `);
    console.log("4. Foreign Keys:");
    fks.rows.forEach((fk: any) =>
      console.log(
        `${fk.constraint_name} ON UPDATE ${fk.update_rule} ON DELETE ${fk.delete_rule}`,
      ),
    );

    // 5. Backfill Count & Legacy Verification
    const countRes = await pool.query(`SELECT COUNT(*) as c FROM "TeacherAssignment"`);
    console.log("5. Total Backfilled rows:", countRes.rows[0].c);

    // 6. Every legacy pair mapping verification
    const mappings = await pool.query(
      `SELECT "batchId", "teacherId", "permissions" FROM "TeacherAssignment" ORDER BY "batchId"`,
    );
    console.log("6 & 7. Backfilled Mappings:", mappings.rows);

    // 8. _prisma_migrations
    const migs = await pool.query(
      `SELECT migration_name, finished_at FROM _prisma_migrations WHERE migration_name = '20260708175307_teacher_assignments'`,
    );
    console.log("8. _prisma_migrations:", migs.rows);
  }
}

main()
  .catch(console.error)
  .finally(() => pool.end());
