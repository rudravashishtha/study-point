process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("--- PRE-MIGRATION PROOF ---");

  const res: { c: bigint }[] =
    await prisma.$queryRaw`SELECT COUNT(*) as c FROM "Batch" WHERE "teacherId" IS NOT NULL`;
  console.log("Source teacher links in Batch:", Number(res[0].c));

  const indexes: { indexname: string; indexdef: string }[] = await prisma.$queryRaw`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename IN ('AcademicSession', 'CurriculumTrack', 'Batch', 'Enrolment')
      AND indexname IN (
        'AcademicSession_isActive_key',
        'CurriculumTrack_board_class_subject_null_prog_key',
        'CurriculumTrack_board_prog_class_subject_key',
        'Batch_session_track_name_key',
        'Enrolment_student_session_track_key'
      )
  `;
  console.log("Pre-migration indexes:");
  indexes.forEach((i) => console.log(i.indexname, "->", i.indexdef));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
