import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("No URL provided");
process.env.DATABASE_URL = url; // Let Prisma pick it up

const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const [{ current_database }] = await prisma.$queryRaw<
    [{ current_database: string }]
  >`SELECT current_database()`;
  console.log(`Verifying DB: ${current_database}`);

  // 1. Check SystemSequence
  const tableCheck = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'SystemSequence'
    );
  `;
  console.log(`SystemSequence exists: ${tableCheck[0].exists}`);

  // 2. Check all 5 custom indexes
  const query = `
    SELECT indexname 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname IN (
      'Batch_session_track_name_key', 
      'Enrolment_student_session_track_key', 
      'AcademicSession_isActive_key',
      'CurriculumTrack_board_class_subject_null_prog_key',
      'CurriculumTrack_board_prog_class_subject_key'
    );
  `;
  const res = await prisma.$queryRawUnsafe<{ indexname: string }[]>(query);
  const found = res.map((r) => r.indexname);
  console.log(`Found custom indexes (${found.length}/5):`);
  for (const f of found) {
    console.log(` - ${f}`);
  }

  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
