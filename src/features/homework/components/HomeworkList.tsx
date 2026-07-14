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
  publishAdminHomeworkAction,
  archiveAdminHomeworkAction,
} from "@/app/admin/homework/actions";
import dynamic from "next/dynamic";
import type { HomeworkFormData } from "./HomeworkFormDialog";

const HomeworkFormDialog = dynamic(
  () => import("./HomeworkFormDialog").then((m) => m.HomeworkFormDialog),
  { loading: () => null },
);
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HomeworkListItem {
  id: string;
  title: string;
  lifecycleState: string;
  academicSessionId: string;
  curriculumTrackId: string;
  batchId: string;
  assignedDate: string | Date;
  dueDate: string;
  fileAssetId?: string | null;
  batch?: { name: string; archivedAt?: Date | string | null } | null;
  chapter?: { name: string } | null;
  topic?: { name: string } | null;
}

interface HomeworkListSession {
  id: string;
  name: string;
}

interface HomeworkListBatch {
  id: string;
  name: string;
  archivedAt?: Date | string | null;
}

interface HomeworkListTrack {
  id: string;
  name?: string | null;
}

interface HomeworkActionResult {
  success: boolean;
  error?: any;
}

function toHomeworkFormData(item: HomeworkListItem): HomeworkFormData {
  return {
    id: item.id,
    title: item.title,
    batchId: item.batchId,
    assignedDate: item.assignedDate,
    dueDate: item.dueDate,
    fileAssetId: item.fileAssetId ?? null,
  };
}

export function HomeworkList({
  homework,
  sessions,
  batches,
  tracks,
}: {
  homework: HomeworkListItem[];
  sessions: HomeworkListSession[];
  batches: HomeworkListBatch[];
  tracks: HomeworkListTrack[];
}) {
  const [editingHomework, setEditingHomework] = useState<HomeworkListItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSession, setFilterSession] = useState<string>("ALL");
  const [filterTrack, setFilterTrack] = useState<string>("ALL");
  const [filterBatch, setFilterBatch] = useState<string>("ALL");
  const [filterState, setFilterState] = useState<string>("ALL");

  const filtered = homework.filter((h) => {
    if (
      search &&
      !h.title.toLowerCase().includes(search.toLowerCase()) &&
      !h.batch?.name?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (filterState !== "ALL" && h.lifecycleState !== filterState) return false;
    if (filterSession !== "ALL" && h.academicSessionId !== filterSession) return false;
    if (filterTrack !== "ALL" && h.curriculumTrackId !== filterTrack) return false;
    if (filterBatch !== "ALL" && h.batchId !== filterBatch) return false;
    return true;
  });

  const handleAction = async (
    action: () => Promise<HomeworkActionResult>,
    successMsg: string,
  ) => {
    try {
      const res = await action();
      if (!res.success) {
        toast.error("Error", { description: typeof res.error === 'string' ? res.error : res.error?.message || "Unknown error" });
        return;
      }
      toast.success("Success", { description: successMsg });
    } catch (e: unknown) {
      toast.error("Error", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  };

  const isOverdue = (dueDate: string) => {
    return isPast(startOfDay(parseISO(dueDate)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 flex-wrap gap-4 items-center w-full sm:w-auto">
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
          <Button
            onClick={() => {
              setEditingHomework(null);
              setIsFormOpen(true);
            }}
          >
            Create Homework
          </Button>
        </div>
        <div className="flex flex-wrap gap-4">
          <Select value={filterSession} onValueChange={(v) => v && setFilterSession(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Sessions</SelectItem>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTrack} onValueChange={(v) => v && setFilterTrack(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Track" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Tracks</SelectItem>
              {tracks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name || "Track"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterBatch} onValueChange={(v) => v && setFilterBatch(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Batches</SelectItem>
              {batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md relative w-full overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  No homework found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((h) => {
                const overdue = h.lifecycleState === "PUBLISHED" && isOverdue(h.dueDate);
                const isArchived = h.lifecycleState === "ARCHIVED";
                const batchArchived = !!h.batch?.archivedAt;

                return (
                  <TableRow key={h.id} className={overdue ? "bg-red-50/50" : ""}>
                    <TableCell className="font-medium max-w-[200px]">
                      <div className="truncate" title={h.title}>
                        {h.title}
                      </div>
                      {h.chapter && (
                        <div className="text-xs text-muted-foreground truncate">
                          {h.chapter.name}
                          {h.topic && ` > ${h.topic.name}`}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{h.batch?.name}</span>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(new Date(h.assignedDate), "MMM d")}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      <span className={overdue ? "text-red-600 font-semibold" : ""}>
                        {format(new Date(h.dueDate), "MMM d")}
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

                        {!isArchived && !batchArchived && (
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
                                      () => publishAdminHomeworkAction(h.id),
                                      "Homework published",
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
                                    () => archiveAdminHomeworkAction(h.id),
                                    "Homework archived",
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

                        {batchArchived && !isArchived && (
                          <span className="text-xs text-muted-foreground italic">
                            Batch archived
                          </span>
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

      <HomeworkFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        homework={editingHomework ? toHomeworkFormData(editingHomework) : null}
        sessions={sessions}
        batches={batches}
        tracks={tracks}
      />
    </div>
  );
}
