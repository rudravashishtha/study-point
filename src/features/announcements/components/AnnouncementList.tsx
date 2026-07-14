"use client";

import React, { useState, useMemo } from "react";
import { Prisma, AnnouncementAudience, AnnouncementPriority } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataListEmpty } from "@/components/admin/data-list/DataListEmpty";
import { FilterField } from "@/components/filters/filter-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnnouncementRowActions } from "./AnnouncementRowActions";
import dynamic from "next/dynamic";

const AnnouncementFormDialog = dynamic(
  () => import("./AnnouncementFormDialog").then((m) => m.AnnouncementFormDialog),
  { loading: () => null },
);

type AnnouncementRow = Prisma.AnnouncementGetPayload<{
  include: {
    academicSession: { select: { id: true; name: true } };
    curriculumTrack: { select: { id: true; displayName: true } };
    batch: { select: { id: true; name: true } };
  };
}>;

const audienceLabel: Record<AnnouncementAudience, string> = {
  PUBLIC: "Public",
  ALL_STUDENTS: "All Students",
  CURRICULUM_TRACK: "Track",
  BATCH: "Batch",
};

const priorityLabel: Record<AnnouncementPriority, string> = {
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

const priorityColor: Record<AnnouncementPriority, string> = {
  NORMAL: "bg-gray-100 text-gray-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

export function AnnouncementList({
  announcements,
  sessions,
  tracks,
  batches,
}: {
  announcements: AnnouncementRow[];
  sessions: { id: string; name: string }[];
  tracks: { id: string; displayName: string; archivedAt: Date | null }[];
  batches: {
    id: string;
    name: string;
    archivedAt: Date | null;
    academicSessionId: string;
    curriculumTrackId: string;
  }[];
}) {
  const [editingAnnouncement, setEditingAnnouncement] = useState<
    AnnouncementRow | undefined
  >();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [archiveFilter, setArchiveFilter] = useState<"active" | "archived" | "all">(
    "active",
  );
  const [audienceFilter, setAudienceFilter] = useState<AnnouncementAudience | "">("");
  const [sessionFilter, setSessionFilter] = useState("");

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      if (archiveFilter === "active" && a.archivedAt) return false;
      if (archiveFilter === "archived" && !a.archivedAt) return false;
      if (audienceFilter && a.audience !== audienceFilter) return false;
      if (sessionFilter && a.academicSessionId !== sessionFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!a.title.toLowerCase().includes(q) && !a.content.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [announcements, searchQuery, archiveFilter, audienceFilter, sessionFilter]);

  const handleEdit = (announcement: AnnouncementRow) => {
    setEditingAnnouncement(announcement);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingAnnouncement(undefined);
    setIsFormOpen(true);
  };

  const statusLabel = (a: AnnouncementRow) => {
    if (a.archivedAt) return { label: "Archived", color: "bg-gray-100 text-gray-600" };
    if (a.publishedAt)
      return { label: "Published", color: "bg-green-100 text-green-800" };
    return { label: "Draft", color: "bg-yellow-100 text-yellow-800" };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4 md:flex-row md:items-start md:justify-between md:space-y-0">
        <div className="flex flex-1 flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
          <input
            type="text"
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:w-64"
          />

          <FilterField label="Status">
            <Select
              value={archiveFilter}
              onValueChange={(v) =>
                setArchiveFilter(v as "active" | "archived" | "all")
              }
            >
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="archived">Archived Only</SelectItem>
                <SelectItem value="all">All Statuses</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Audience">
            <Select
              value={audienceFilter}
              onValueChange={(v) =>
                setAudienceFilter(v as AnnouncementAudience | "")
              }
            >
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="Audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Audiences</SelectItem>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="ALL_STUDENTS">All Students</SelectItem>
                <SelectItem value="CURRICULUM_TRACK">Track</SelectItem>
                <SelectItem value="BATCH">Batch</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Session">
            <Select
              value={sessionFilter}
              onValueChange={(v) => setSessionFilter(v || "")}
            >
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="Session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sessions</SelectItem>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
        </div>

        <button
          onClick={handleCreate}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 mt-4 md:mt-0"
        >
          Create Notice
        </button>
      </div>

      {filteredAnnouncements.length === 0 ? (
        <DataListEmpty
          title="No notices found."
          isFiltered={
            searchQuery !== "" ||
            archiveFilter !== "active" ||
            audienceFilter !== "" ||
            sessionFilter !== ""
          }
        />
      ) : (
        <>
          {/* Mobile View */}
          <div className="flex flex-col space-y-4 md:hidden">
            {filteredAnnouncements.map((a) => (
              <div
                key={a.id}
                className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold truncate max-w-[200px]">{a.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor[a.priority]}`}
                  >
                    {priorityLabel[a.priority]}
                  </span>
                </div>

                <div className="text-sm space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Audience</span>
                    <span>
                      {audienceLabel[a.audience]}
                      {a.curriculumTrack && (
                        <span className="ml-1 text-xs">
                          ({a.curriculumTrack.displayName})
                        </span>
                      )}
                      {a.batch && <span className="ml-1 text-xs">({a.batch.name})</span>}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Session</span>
                    <span>{a.academicSession?.name || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusLabel(a).color}`}
                    >
                      {statusLabel(a).label}
                    </span>
                  </div>
                  {a.publishedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Published</span>
                      <span>{a.publishedAt.toLocaleDateString()}</span>
                    </div>
                  )}
                  {a.archivedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Archived</span>
                      <span className="text-muted-foreground">Yes</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2 border-t">
                  <AnnouncementRowActions announcement={a} onEdit={() => handleEdit(a)} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden w-full overflow-auto rounded-md border md:block bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnnouncements.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <span className="max-w-[200px] truncate">{a.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span>{audienceLabel[a.audience]}</span>
                      {a.curriculumTrack && (
                        <span className="ml-1 text-xs">
                          ({a.curriculumTrack.displayName})
                        </span>
                      )}
                      {a.batch && <span className="ml-1 text-xs">({a.batch.name})</span>}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColor[a.priority]}`}
                      >
                        {priorityLabel[a.priority]}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.academicSession?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusLabel(a).color}`}
                      >
                        {statusLabel(a).label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <AnnouncementRowActions announcement={a} onEdit={() => handleEdit(a)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <AnnouncementFormDialog
        announcement={editingAnnouncement}
        sessions={sessions}
        tracks={tracks}
        batches={batches}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </div>
  );
}
