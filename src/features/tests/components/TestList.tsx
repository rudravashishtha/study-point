"use client";

import { useState } from "react";
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
  publishAdminTestAction,
  archiveAdminTestAction,
} from "@/app/admin/tests/actions";
import dynamic from "next/dynamic";

const TestFormDialog = dynamic(
  () => import("./TestFormDialog").then((m) => m.TestFormDialog),
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
import { FilterField } from "@/components/filters/filter-field";

interface TestListItem {
  id: string;
  title: string;
  batchId: string;
  academicSessionId: string;
  curriculumTrackId: string;
  testType: string;
  testDate: string | Date;
  maximumMarks: number;
  durationMinutes?: number | null;
  lifecycleState: string;
  fileAssetId?: string | null;
  batch?: { name: string; archivedAt?: Date | string | null } | null;
  chapter?: { name: string } | null;
  topic?: { name: string } | null;
}

interface ListSession {
  id: string;
  name: string;
}
interface ListBatch {
  id: string;
  name: string;
  archivedAt?: Date | string | null;
}
interface ListTrack {
  id: string;
  name?: string;
}

interface ActionResult {
  success: boolean;
  error?: /* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: Server action boundary */ any;
}

export function TestList({
  tests,
  sessions,
  batches,
  tracks,
}: {
  tests: TestListItem[];
  sessions: ListSession[];
  batches: ListBatch[];
  tracks: ListTrack[];
}) {
  const [editingTest, setEditingTest] = useState<TestListItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSession, setFilterSession] = useState<string>("ALL");
  const [filterTrack, setFilterTrack] = useState<string>("ALL");
  const [filterBatch, setFilterBatch] = useState<string>("ALL");
  const [filterState, setFilterState] = useState<string>("ALL");

  const filtered = tests.filter((t) => {
    if (
      search &&
      !t.title.toLowerCase().includes(search.toLowerCase()) &&
      !t.batch?.name?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (filterState !== "ALL" && t.lifecycleState !== filterState) return false;
    if (filterSession !== "ALL" && t.academicSessionId !== filterSession) return false;
    if (filterTrack !== "ALL" && t.curriculumTrackId !== filterTrack) return false;
    if (filterBatch !== "ALL" && t.batchId !== filterBatch) return false;
    return true;
  });

  const handleAction = async (
    action: () => Promise<ActionResult>,
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
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
          <div className="flex flex-1 flex-col gap-4 md:flex-row md:flex-wrap md:items-end w-full">
            <Input
              placeholder="Search tests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <FilterField label="Status">
              <Select value={filterState} onValueChange={(v) => v && setFilterState(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="w-auto min-w-[var(--anchor-width)] max-w-[90vw] overflow-x-hidden">
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Session">
              <Select value={filterSession} onValueChange={(v) => v && setFilterSession(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Session" />
                </SelectTrigger>
                <SelectContent className="w-auto min-w-[var(--anchor-width)] max-w-[90vw] overflow-x-hidden">
                  <SelectItem value="ALL">All Sessions</SelectItem>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Track">
              <Select value={filterTrack} onValueChange={(v) => v && setFilterTrack(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Track" />
                </SelectTrigger>
                <SelectContent className="w-auto min-w-[var(--anchor-width)] max-w-[90vw] overflow-x-hidden">
                  <SelectItem value="ALL">All Tracks</SelectItem>
                  {tracks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name || "Track"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Batch">
              <Select value={filterBatch} onValueChange={(v) => v && setFilterBatch(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Batch" />
                </SelectTrigger>
                <SelectContent className="w-auto min-w-[var(--anchor-width)] max-w-[90vw] overflow-x-hidden">
                  <SelectItem value="ALL">All Batches</SelectItem>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
          </div>
          <Button
            onClick={() => {
              setEditingTest(null);
              setIsFormOpen(true);
            }}
          >
            Create Test
          </Button>
        </div>
      </div>

      <div className="border rounded-md relative w-full overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Marks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  No tests found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => {
                const isArchived = t.lifecycleState === "ARCHIVED";
                const batchArchived = !!t.batch?.archivedAt;

                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium max-w-[200px]">
                      <div className="truncate" title={t.title}>
                        {t.title}
                      </div>
                      {t.chapter && (
                        <div className="text-xs text-muted-foreground truncate">
                          {t.chapter.name}
                          {t.topic && ` > ${t.topic.name}`}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{t.batch?.name}</span>
                    </TableCell>
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
                    <TableCell>
                      <Badge
                        variant={
                          t.lifecycleState === "PUBLISHED"
                            ? "default"
                            : t.lifecycleState === "ARCHIVED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {t.lifecycleState.charAt(0) + t.lifecycleState.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {t.fileAssetId && !isArchived && (
                          <a
                            href={`/api/tests/${t.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            title="Download question paper"
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
                                  setEditingTest(t);
                                  setIsFormOpen(true);
                                }}
                              >
                                <Edit className="size-4 mr-2" />
                                Edit
                              </DropdownMenuItem>

                              {t.lifecycleState !== "PUBLISHED" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleAction(
                                      () => publishAdminTestAction(t.id),
                                      "Test published",
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
                                    () => archiveAdminTestAction(t.id),
                                    "Test archived",
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

      <TestFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        test={editingTest ?? undefined}
        sessions={sessions}
        batches={batches}
        tracks={tracks}
      />
    </div>
  );
}
