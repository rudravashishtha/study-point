import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TeacherAssignment, Batch, Teacher } from "@prisma/client";
import { Plus, Clock, UserCheck } from "lucide-react";
import { AssignTeacherDialog } from "./AssignTeacherDialog";
import { getAvailableTeachersForBatch } from "../../domain/teacher-availability";
import { AssignmentRowActions } from "./AssignmentRowActions";
import { listTeachers } from "@/server/services/teachers";
import { resolveEffectivePermissions } from "@/lib/domain/permissions";

interface BatchTeachersTabProps {
  batch: Batch;
  assignments: (TeacherAssignment & { teacher: Teacher })[];
  isArchived: boolean;
}

export async function BatchTeachersTab({
  batch,
  assignments,
  isArchived,
}: BatchTeachersTabProps) {
  // Fetch active teachers to pass to the dialog
  const { items: activeTeachers } = await listTeachers({ status: "active", limit: 1000 });

  const activeAssignments = assignments.filter((a) => !a.archivedAt);
  const historicalAssignments = assignments.filter((a) => !!a.archivedAt);

  const availableTeachers = getAvailableTeachersForBatch(activeTeachers, assignments);

  return (
    <div className="space-y-8 rounded-md border p-6 bg-card shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <UserCheck className="size-5" /> Active Teachers
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Teachers currently managing or teaching this batch.
          </p>
        </div>
        {!isArchived && (
          <AssignTeacherDialog
            batchId={batch.id}
            availableTeachers={availableTeachers}
            trigger={
              <Button>
                <Plus className="size-4 mr-2" /> Assign Teacher
              </Button>
            }
          />
        )}
      </div>

      <div className="space-y-4">
        {activeAssignments.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
            No active teachers assigned to this batch.
          </div>
        ) : (
          activeAssignments.map((assignment) => {
            const effective = resolveEffectivePermissions(assignment.permissions);
            return (
              <div
                key={assignment.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4 bg-background"
              >
                <div>
                  <p className="font-semibold">{assignment.teacher.displayName}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-xs font-medium text-muted-foreground mr-1 uppercase tracking-wider">
                      Explicit:
                    </span>
                    {assignment.permissions.map((p) => (
                      <Badge key={p} variant="secondary" className="text-[10px]">
                        {p}
                      </Badge>
                    ))}
                  </div>
                  {effective.length > assignment.permissions.length && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-xs font-medium text-muted-foreground mr-1 uppercase tracking-wider">
                        Implied:
                      </span>
                      {effective
                        .filter((p) => !assignment.permissions.includes(p))
                        .map((p) => (
                          <Badge
                            key={p}
                            variant="outline"
                            className="text-[10px] opacity-70"
                          >
                            {p}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <AssignmentRowActions
                    batchId={batch.id}
                    assignment={assignment}
                    disabled={isArchived}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {historicalAssignments.length > 0 && (
        <div className="pt-8 border-t">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
              <Clock className="size-5" /> Assignment History
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Read-only record of past teachers assigned to this batch.
            </p>
          </div>

          <div className="space-y-4 opacity-70">
            {historicalAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4 bg-background/50"
              >
                <div>
                  <p className="font-semibold">{assignment.teacher.displayName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Removed on {assignment.archivedAt?.toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-xs font-medium text-muted-foreground mr-1 uppercase tracking-wider">
                      Explicit at removal:
                    </span>
                    {assignment.permissions.map((p) => (
                      <Badge key={p} variant="secondary" className="text-[10px]">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Badge variant="outline">Historical</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
