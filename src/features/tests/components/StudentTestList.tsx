"use client";

import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function StudentTestList({ tests }: { tests: any[] }) {
  if (tests.length === 0) {
    return null;
  }

  const testTypeLabel = (type: string) => {
    switch (type) {
      case "CHAPTER_TEST":
        return "Chapter";
      case "UNIT_TEST":
        return "Unit";
      case "FULL_SYLLABUS_TEST":
        return "Full Syllabus";
      default:
        return type;
    }
  };

  return (
    <div className="border rounded-md relative w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Test</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Marks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tests.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <div className="font-medium">{t.title}</div>
                {t.description && (
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {t.description}
                  </div>
                )}
                {t.chapter && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {t.chapter.name}
                    {t.topic && ` > ${t.topic.name}`}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-sm">{t.batch?.name}</TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                {testTypeLabel(t.testType)}
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                {format(new Date(t.testDate), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-sm">
                {t.maximumMarks}
                {t.durationMinutes && ` / ${t.durationMinutes}min`}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
