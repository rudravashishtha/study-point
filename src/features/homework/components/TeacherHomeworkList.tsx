"use client";

import { useState } from "react";
import { format, isPast, parseISO, startOfDay } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Edit, Archive, CheckCircle, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  publishTeacherHomeworkAction,
  archiveTeacherHomeworkAction,
} from "@/app/teacher/batches/[batchId]/actions";
import { TeacherHomeworkFormDialog } from "./TeacherHomeworkFormDialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TeacherHomeworkList({
  homework,
  chapters,
  batchId,
  canManage,
}: {
  homework: any[];
  chapters: any[];
  batchId: string;
  canManage: boolean;
}) {
  const [editingHomework, setEditingHomework] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState<string>("ALL");

  const filtered = homework.filter((h) => {
    if (search && !h.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterState !== "ALL" && h.lifecycleState !== filterState) return false;
    return true;
  });

  const handleAction = async (action: () => Promise<any>, successMsg: string) => {
    try {
      const res = await action();
      if (!res.success) {
        toast.error("Error", { description: res.error.message });
        return;
      }
      toast.success("Success", { description: successMsg });
    } catch (e: any) {
      toast.error("Error", { description: e.message });
    }
  };

  const isOverdue = (dueDate: string) => {
    return isPast(startOfDay(parseISO(dueDate)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 items-center w-full sm:w-auto">
          <Input
            placeholder="Search homework..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={filterState} onValueChange={(v) => v && setFilterState(v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All States</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditingHomework(null);
              setIsFormOpen(true);
            }}
          >
            Create Homework
          </Button>
        )}
      </div>

      <div className="border rounded-md relative w-full overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No homework found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((h) => {
                const overdue = h.lifecycleState === "PUBLISHED" && isOverdue(h.dueDate);
                const isArchived = h.lifecycleState === "ARCHIVED";
                const canMutate = canManage && !isArchived;

                return (
                  <TableRow key={h.id} className={overdue ? "bg-red-50/50" : ""}>
                    <TableCell className="font-medium">
                      <div>{h.title}</div>
                      {h.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {h.description}
                        </div>
                      )}
                      {h.chapter && (
                        <div className="text-xs text-muted-foreground">
                          {h.chapter.name}
                          {h.topic && ` > ${h.topic.name}`}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(new Date(h.assignedDate), "PP")}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      <span className={overdue ? "text-red-600 font-semibold" : ""}>
                        {format(new Date(h.dueDate), "PP")}
                        {overdue && " (Overdue)"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          h.lifecycleState === "PUBLISHED"
                            ? "default"
                            : h.lifecycleState === "ARCHIVED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {h.lifecycleState}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {h.fileAssetId && (
                          <a
                            href={`/api/homework/${h.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            title="Download"
                            className={buttonVariants({ variant: "ghost", size: "icon" })}
                          >
                            <Download className="size-4" />
                          </a>
                        )}

                        {canMutate && (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                              })}
                            >
                              Actions
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingHomework(h);
                                  setIsFormOpen(true);
                                }}
                              >
                                <Edit className="size-4 mr-2" />
                                Edit
                              </DropdownMenuItem>

                              {h.lifecycleState !== "PUBLISHED" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleAction(
                                      () => publishTeacherHomeworkAction(batchId, h.id),
                                      "Homework published successfully",
                                    )
                                  }
                                >
                                  <CheckCircle className="size-4 mr-2 text-green-600" />
                                  Publish
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onClick={() =>
                                  handleAction(
                                    () => archiveTeacherHomeworkAction(batchId, h.id),
                                    "Homework archived successfully",
                                  )
                                }
                                className="text-destructive focus:text-destructive"
                              >
                                <Archive className="size-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <TeacherHomeworkFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        homework={editingHomework}
        batchId={batchId}
        chapters={chapters}
      />
    </div>
  );
}
