import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/permissions";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { BookOpen, ClipboardCheck, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Teacher Dashboard | Study Point Mathematics",
};

export default async function TeacherPage() {
  const appUser = await requireRole(Role.TEACHER);

  const assignments = await db.teacherAssignment.findMany({
    where: {
      teacherId: appUser.teacherId!,
      archivedAt: null,
      batch: { archivedAt: null, isActive: true },
    },
    include: {
      batch: {
        select: {
          id: true,
          name: true,
          academicSession: { select: { name: true } },
          curriculumTrack: {
            select: {
              classLevel: true,
              subject: { select: { name: true } },
            },
          },
          _count: { select: { studyMaterials: true, homeworks: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const batches = assignments.map((a) => ({
    id: a.batch.id,
    name: a.batch.name,
    academicSessionName: a.batch.academicSession.name,
    subjectName: a.batch.curriculumTrack.subject.name,
    classLevel: a.batch.curriculumTrack.classLevel,
    materialCount: a.batch._count.studyMaterials,
    homeworkCount: a.batch._count.homeworks,
  }));

  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="size-16 rounded-full bg-surface-elevated border border-dashed border-border flex items-center justify-center mb-4">
          <BookOpen className="size-8 text-muted-foreground opacity-50" />
        </div>
        <h2 className="text-xl font-bold mb-2">No batches assigned</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          You have not been assigned to any active batches yet. Contact an administrator
          to get started.
        </p>
        <Link
          href="/teacher"
          className="mt-6 text-sm font-medium text-brand-glow hover:underline"
        >
          Refresh this page
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold">My Batches</h2>
        <p className="text-sm text-muted-foreground mt-1">
          You are assigned to {batches.length} batch{batches.length > 1 ? "es" : ""}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {batches.map((batch) => (
          <Link
            key={batch.id}
            href={`/teacher/batches/${batch.id}`}
            className="block rounded-xl border border-border/40 bg-surface-elevated hover:bg-surface-interactive transition-colors p-5 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-base">{batch.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {batch.subjectName} &middot; Class {batch.classLevel} &middot;{" "}
                  {batch.academicSessionName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="size-3.5" />
                {batch.materialCount} material{batch.materialCount !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <ClipboardCheck className="size-3.5" />
                {batch.homeworkCount} homework{batch.homeworkCount !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-brand-glow opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Open batch</span>
              <ArrowRight className="size-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
