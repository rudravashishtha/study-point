import type { Teacher, Subject } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataListEmpty } from "@/components/admin/data-list/DataListEmpty";
import { TeacherRowActions } from "./TeacherRowActions";
import { getProvisioningDisplayStatus } from "../domain/provisioning";
import type { AppUserStatus } from "../domain/provisioning";

export type TeacherWithAppUser = Teacher & {
  appUser: { status: string } | null;
};

interface TeacherListProps {
  teachers: TeacherWithAppUser[];
  availableSubjects: Subject[];
}

export function TeacherList({ teachers, availableSubjects }: TeacherListProps) {
  if (teachers.length === 0) {
    return (
      <DataListEmpty
        title="No teachers found"
        description="Try adjusting your filters or search query."
      />
    );
  }

  return (
    <>
      {/* Mobile View */}
      <div className="flex flex-col space-y-4 md:hidden">
        {teachers.map((teacher) => (
          <div
            key={teacher.id}
            className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold leading-none">{teacher.displayName}</p>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {teacher.email && <p>{teacher.email}</p>}
                  {teacher.phone && <p>{teacher.phone}</p>}
                </div>
              </div>
              <TeacherRowActions teacher={teacher} availableSubjects={availableSubjects} />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <Badge variant={teacher.active ? "default" : "secondary"}>
                {teacher.active ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline">
                {getProvisioningDisplayStatus(
                  teacher.appUser?.status as AppUserStatus | null,
                )}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden w-full overflow-auto rounded-md border md:block bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Provisioning</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell className="font-medium">{teacher.displayName}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {teacher.email && <div>{teacher.email}</div>}
                    {teacher.phone && (
                      <div className="text-muted-foreground">{teacher.phone}</div>
                    )}
                    {!teacher.email && !teacher.phone && (
                      <span className="text-muted-foreground italic">
                        No contact provided
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={teacher.active ? "default" : "secondary"}>
                    {teacher.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getProvisioningDisplayStatus(
                      teacher.appUser?.status as AppUserStatus | null,
                    )}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <TeacherRowActions teacher={teacher} availableSubjects={availableSubjects} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
