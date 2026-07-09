import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const query = `
    SELECT indexname 
    FROM pg_indexes 
    WHERE indexname IN (
      'AcademicSession_isActive_key',
      'CurriculumTrack_board_class_subject_null_prog_key',
      'CurriculumTrack_board_prog_class_subject_key'
    );
  `;
  const res = await pool.query(query);
  console.log("Indexes currently in DB:");
  for (const row of res.rows) {
    console.log("- " + row.indexname);
  }
  await pool.end();
}
main().catch(console.error);
