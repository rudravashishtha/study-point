"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { StudentFormDialog } from "@/features/students/components/StudentFormDialog";

export function CreateStudentButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus className="mr-2 h-4 w-4" />
        New Student
      </button>
      <StudentFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
