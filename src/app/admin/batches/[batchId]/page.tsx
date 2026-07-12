import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Calendar, UserCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth/permissions";
import { getBatchById } from "@/server/services/batches";
import { getBatchEnrolments } from "@/server/services/enrolments";
import { getBatchTeacherAssignments } from "@/server/services/teacher-assignments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BatchScheduleEditor } from "@/features/batches/components/BatchScheduleEditor";
import { BatchMembershipTab } from "@/features/batches/components/BatchMembershipTab";
import { BatchTeachersTab } from "@/features/batches/components/teachers/BatchTeachersTab";
import { Batch, Enrolment, Student, TeacherAssignment, Teacher } from "@prisma/client";

type EnrolmentWithStudent = Enrolment & { student: Student };

export default async function BatchDetailPage({
  params,
}: {
  params: { batchId: string };
}) {
  await requireAdmin();

  const { batchId } = params;

  const [batch, enrolments, teacherAssignments] = await Promise.all([
    getBatchById(batchId),
    getBatchEnrolments(batchId),
    getBatchTeacherAssignments(batchId),
  ]);

  if (!batch) {
    notFound();
  }

  const isArchived = !!batch.archivedAt;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/batches">
          <Button variant="ghost" size="icon" type="button">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{batch.name}</h1>
            {isArchived ? (
              <Badge variant="destructive">Archived</Badge>
            ) : !batch.isActive ? (
              <Badge variant="secondary">Inactive</Badge>
            ) : (
              <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20">
                Active
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {batch.academicSession.name} •{" "}
            {batch.curriculumTrack.displayName ||
              `${batch.curriculumTrack.subject.name} - Class ${batch.curriculumTrack.classLevel}`}
          </p>
        </div>
      </div>

      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="schedule" className="gap-2">
            <Calendar className="size-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="size-4" />
            Members ({batch._count.enrolments}
            {batch.capacity ? ` / ${batch.capacity}` : ""})
          </TabsTrigger>
          <TabsTrigger value="teachers" className="gap-2">
            <UserCheck className="size-4" />
            Teachers
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="schedule"
          className="mt-0 border rounded-md p-6 bg-card text-card-foreground shadow-sm"
        >
          <BatchScheduleEditor
            batch={
              batch as Batch & { schedules: import("@prisma/client").BatchSchedule[] }
            }
            isArchived={isArchived}
          />
        </TabsContent>

        <TabsContent value="members" className="mt-0">
          <BatchMembershipTab
            batch={batch as Batch}
            enrolments={enrolments as EnrolmentWithStudent[]}
            isArchived={isArchived}
          />
        </TabsContent>

        <TabsContent value="teachers" className="mt-0">
          <BatchTeachersTab
            batch={batch as Batch}
            assignments={
              teacherAssignments as (TeacherAssignment & { teacher: Teacher })[]
            }
            isArchived={isArchived}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
