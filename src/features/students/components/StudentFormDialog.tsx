"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { Student } from "@prisma/client";
import { createStudentAction, updateStudentAction } from "@/app/admin/students/actions";
import { useRouter } from "next/navigation";

export function StudentFormDialog({
  student,
  open,
  onOpenChange,
}: {
  student?: Student;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const payload = {
      fullName: formData.get("fullName") as string,
      phone: (formData.get("phone") as string) || null,
      guardianPhone: (formData.get("guardianPhone") as string) || null,
      email: (formData.get("email") as string) || null,
      joiningDate: formData.get("joiningDate")
        ? new Date(formData.get("joiningDate") as string)
        : null,
    };

    startTransition(async () => {
      const res = student
        ? await updateStudentAction(student.id, payload)
        : await createStudentAction(payload);

      if (!res.success) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success(
          student ? "Student updated successfully" : "Student created successfully",
        );
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  if (!open) return null;

  const joiningDateValue = student?.joiningDate
    ? new Date(student.joiningDate).toISOString().split("T")[0]
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-md border bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">
          {student ? "Edit Student" : "Create Student"}
        </h2>
        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {student && (
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-muted-foreground">
                Student Code
              </label>
              <div className="text-sm px-3 py-2 bg-muted rounded-md">
                {student.studentCode}
              </div>
            </div>
          )}
          {student && (
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-muted-foreground">
                Account Status
              </label>
              <div className="text-sm px-3 py-2 bg-muted rounded-md flex flex-col gap-1">
                <span>{student.accountStatus}</span>
                <span className="text-xs text-muted-foreground">
                  Note: Account access is managed in a later module.
                </span>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              Full Name *
            </label>
            <input
              id="fullName"
              name="fullName"
              required
              defaultValue={student?.fullName}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="e.g. John Doe"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={student?.phone || ""}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="guardianPhone" className="text-sm font-medium">
              Guardian Phone
            </label>
            <input
              id="guardianPhone"
              name="guardianPhone"
              type="tel"
              defaultValue={student?.guardianPhone || ""}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={student?.email || ""}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="joiningDate" className="text-sm font-medium">
              Joining Date
            </label>
            <input
              id="joiningDate"
              name="joiningDate"
              type="date"
              defaultValue={joiningDateValue}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="mt-6 flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {isPending ? "Saving..." : student ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
