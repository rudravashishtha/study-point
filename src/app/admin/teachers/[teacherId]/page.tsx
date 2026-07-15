import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, AlertTriangle } from "lucide-react";
import { requireAdmin } from "@/lib/auth/permissions";
import { getTeacher } from "@/server/services/teachers";
import { getTeacherBatchAssignments } from "@/server/services/teacher-assignments";
import { resolveEffectivePermissions } from "@/lib/domain/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TeacherRowActions } from "@/features/teachers/components/TeacherRowActions";
import { DataListEmpty } from "@/components/admin/data-list/DataListEmpty";

import { getProvisioningDisplayStatus } from "@/features/teachers/domain/provisioning";
import type { AppUserStatus } from "@/features/teachers/domain/provisioning";

export default async function TeacherDetailPage({
  params,
}: {
  params: Promise<{ teacherId: string }>;
}) {
  await requireAdmin();

  const { teacherId } = await params;

  const [teacher, allAssignments] = await Promise.all([
    getTeacher(teacherId),
    getTeacherBatchAssignments(teacherId, { includeArchived: true }),
  ]);

  if (!teacher) {
    notFound();
  }

  const activeAssignments = allAssignments.filter((a) => !a.archivedAt);
  const historicalAssignments = allAssignments.filter((a) => !!a.archivedAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/teachers">
          <Button variant="ghost" size="icon" type="button">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{teacher.displayName}</h1>
            <Badge variant={teacher.active ? "default" : "secondary"}>
              {teacher.active ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline">
              {getProvisioningDisplayStatus(
                teacher.appUser?.status as AppUserStatus | null,
              )}
            </Badge>
          </div>
          <div className="text-muted-foreground mt-1 flex gap-4">
            {teacher.email && <span>{teacher.email}</span>}
            {teacher.phone && <span>{teacher.phone}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TeacherRowActions teacher={teacher} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="font-semibold mb-4">Profile Information</h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Qualifications</dt>
                <dd className="font-medium mt-1">
                  {teacher.qualifications || "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Bio</dt>
                <dd className="font-medium mt-1 whitespace-pre-wrap">
                  {teacher.bio || "Not specified"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="size-5" /> Active Batch Assignments
              </h2>
            </div>

            {activeAssignments.length === 0 ? (
              <DataListEmpty
                title="No active assignments"
                description="This teacher is not currently assigned to any batches."
              />
            ) : (
              <div className="space-y-3">
                {activeAssignments.map((assignment) => {
                  const effective = resolveEffectivePermissions(assignment.permissions);
                  const track = assignment.batch.curriculumTrack as {
                    subject: { name: string };
                    classLevel: string;
                  };

                  return (
                    <div
                      key={assignment.id}
                      className="rounded-lg border bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            href={`/admin/batches/${assignment.batchId}`}
                            className="font-semibold text-primary hover:underline"
                          >
                            {assignment.batch.name}
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1">
                            {assignment.batch.academicSession.name} • {track.subject.name}{" "}
                            - Class {track.classLevel}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                          Explicit Permissions
                        </p>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {assignment.permissions.map((p) => (
                            <Badge key={p} variant="secondary" className="text-[10px]">
                              {p}
                            </Badge>
                          ))}
                        </div>

                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                          Effective (Implied)
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {effective
                            .filter((p) => !assignment.permissions.includes(p))
                            .map((p) => (
                              <Badge key={p} variant="outline" className="text-[10px]">
                                {p}
                              </Badge>
                            ))}
                          {effective.length === assignment.permissions.length && (
                            <span className="text-xs text-muted-foreground italic">
                              None added implicitly
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {historicalAssignments.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="size-5" /> Historical Assignments
                </h2>
              </div>
              <div className="space-y-3 opacity-70">
                {historicalAssignments.map((assignment) => {
                  const track = assignment.batch.curriculumTrack as {
                    subject: { name: string };
                    classLevel: string;
                  };
                  return (
                    <div
                      key={assignment.id}
                      className="rounded-lg border bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{assignment.batch.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {assignment.batch.academicSession.name} • {track.subject.name}{" "}
                            - Class {track.classLevel}
                          </p>
                        </div>
                        <Badge variant="outline">Removed</Badge>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                          Explicit Permissions at Removal
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {assignment.permissions.map((p) => (
                            <Badge key={p} variant="secondary" className="text-[10px]">
                              {p}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs mt-3 text-muted-foreground">
                          Removed on {assignment.archivedAt?.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
