import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const tables = [
    "Board",
    "Programme",
    "Subject",
    "CurriculumTrack",
    "Chapter",
    "Topic",
    "AcademicSession",
    "AppUser",
    "AuditLog",
  ];

  for (const table of tables) {
    const res = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
    console.log(`\n--- ${table} ---`);
    console.log(`Count: ${res.rows[0].count}`);

    if (table === "AcademicSession") {
      const archived = await pool.query(
        `SELECT COUNT(*) FROM "${table}" WHERE "archivedAt" IS NOT NULL`,
      );
      console.log(`Archived count: ${archived.rows[0].count}`);
    } else if (table !== "AppUser" && table !== "AuditLog") {
      const activeQuery = await pool.query(
        `SELECT COUNT(*) FROM "${table}" WHERE "active" = false`,
      );
      console.log(`active = false count: ${activeQuery.rows[0].count}`);
    }
  }

  const progDups = await pool.query(`
    SELECT "boardId", "code", COUNT(*)
    FROM "Programme"
    GROUP BY "boardId", "code"
    HAVING COUNT(*) > 1
  `);
  console.log(`\nDuplicate Programme (boardId, code): ${progDups.rows.length}`);

  const adminQuery = await pool.query(
    `SELECT id, role, status FROM "AppUser" WHERE role = 'ADMIN'`,
  );
  console.log(`\nAdmin AppUsers: ${adminQuery.rows.length}`);
  if (adminQuery.rows.length > 0) {
    const admin = adminQuery.rows[0];
    console.log(`Admin [REDACTED_ID]: role = ${admin.role}, status = ${admin.status}`);
  }

  const migrations = await pool.query(
    `SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC`,
  );
  console.log(`\nApplied Migrations:`);
  for (const m of migrations.rows) {
    console.log(`- ${m.migration_name} (Finished: ${m.finished_at})`);
  }

  await pool.end();
}
main().catch(console.error);
