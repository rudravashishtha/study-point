import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const indexes = await pool.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' 
      AND (
        indexname LIKE '%_key' OR 
        indexname LIKE '%_idx' OR 
        indexname LIKE '%_pkey'
      )
    ORDER BY indexname;
  `);
  console.log("INDEXES:");
  for (const row of indexes.rows) {
    console.log("- " + row.indexname);
  }

  await pool.end();
}
main().catch(console.error);
