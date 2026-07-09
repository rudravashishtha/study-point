import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log("--- MIGRATIONS ---");
  const migrations = await pool.query(
    `SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 2`,
  );
  for (const m of migrations.rows) {
    console.log(`Applied: ${m.migration_name}`);
  }

  console.log("\n--- COLUMNS ---");
  const tables = ["Board", "Programme", "Subject", "CurriculumTrack", "Chapter", "Topic"];
  for (const table of tables) {
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`,
    );
    const colNames = cols.rows.map((r) => r.column_name);
    console.log(
      `${table}: active=${colNames.includes("active")}, archivedAt=${colNames.includes("archivedAt")}, createdBy=${colNames.includes("createdBy")}`,
    );
  }

  const asCols = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'AcademicSession'`,
  );
  const asColNames = asCols.rows.map((r) => r.column_name);
  console.log(
    `AcademicSession: isActive=${asColNames.includes("isActive")}, archivedAt=${asColNames.includes("archivedAt")}, createdBy=${asColNames.includes("createdBy")}`,
  );

  console.log("\n--- INDEXES & CONSTRAINTS ---");
  const indexes = await pool.query(`
    SELECT indexname 
    FROM pg_indexes 
    WHERE indexname IN (
      'AcademicSession_isActive_key',
      'CurriculumTrack_board_class_subject_null_prog_key',
      'CurriculumTrack_board_prog_class_subject_key',
      'Programme_boardId_code_key',
      'Board_code_key',
      'Subject_code_key',
      'AcademicSession_name_key'
    );
  `);
  for (const idx of indexes.rows) {
    console.log(`Exists: ${idx.indexname}`);
  }

  console.log("\n--- ADMIN ---");
  const admin = await pool.query(
    `SELECT role, status FROM "AppUser" WHERE role = 'ADMIN'`,
  );
  if (admin.rows.length === 1) {
    console.log(`Admin OK: role=${admin.rows[0].role}, status=${admin.rows[0].status}`);
  }

  await pool.end();
}
main().catch(console.error);
