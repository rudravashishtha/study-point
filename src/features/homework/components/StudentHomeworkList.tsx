"use client";

import { isPast, parseISO, startOfDay } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { Download } from "lucide-react";

export interface StudentHomeworkItem {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  batchId: string;
  fileAssetId?: string | null;
  assignedDate: string | Date;
  batch?: { name: string } | null;
  chapter?: { name: string } | null;
  topic?: { name: string } | null;
}

export function StudentHomeworkList({ homework }: { homework: StudentHomeworkItem[] }) {
  const isOverdue = (dueDate: string) => {
    return isPast(startOfDay(parseISO(dueDate)));
  };

  const formatDate = (value: string | Date) => {
    const date = typeof value === "string" ? parseISO(value) : value;
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (homework.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Homework</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead>Assigned</TableHead>
            <TableHead>Due</TableHead>
            <TableHead className="text-right">File</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {homework.map((h) => {
            const overdue = isOverdue(h.dueDate);
            return (
              <TableRow key={h.id} className={overdue ? "bg-red-50/50" : ""}>
                <TableCell>
                  <div className="font-medium">{h.title}</div>
                  {h.description && (
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {h.description}
                    </div>
                  )}
                  {h.chapter && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {h.chapter.name}
                      {h.topic && ` > ${h.topic.name}`}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm">{h.batch?.name}</TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {formatDate(h.assignedDate)}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  <span className={overdue ? "text-red-600 font-semibold" : ""}>
                    {h.dueDate}
                    {overdue && " (Overdue)"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {h.fileAssetId && (
                    <a
                      href={`/api/homework/${h.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      title="Download attachment"
                      className={buttonVariants({ variant: "ghost", size: "icon" })}
                    >
                      <Download className="size-4" />
                    </a>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
