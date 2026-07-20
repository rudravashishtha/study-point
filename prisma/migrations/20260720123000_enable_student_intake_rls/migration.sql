-- Supabase exposes the public schema through the Data API when roles are granted.
-- These tables are intentionally accessed through server-side Prisma only.
ALTER TABLE "StudentIntakeLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudentIntakeSubmission" ENABLE ROW LEVEL SECURITY;
