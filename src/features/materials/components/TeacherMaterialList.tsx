"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Download, Edit, Archive, CheckCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  publishTeacherMaterialAction,
  archiveTeacherMaterialAction,
} from "@/app/teacher/batches/[batchId]/actions";
import dynamic from "next/dynamic";

const TeacherMaterialFormDialog = dynamic(
  () => import("./TeacherMaterialFormDialog").then((m) => m.TeacherMaterialFormDialog),
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

export interface TeacherMaterialItem {
  id: string;
  title: string;
  description?: string | null;
  resourceType: string;
  visibility?: string;
  lifecycleState: string;
  fileAssetId?: string | null;
  externalLinkUrl?: string | null;
  chapterId?: string | null;
  topicId?: string | null;
  createdAt: string | Date;
}

export interface TeacherChapterItem {
  id: string;
  name: string;
  topics?: { id: string; name: string }[];
}

const resourceTypeLabel: Record<string, string> = {
  DOCUMENT: "Document",
  PRESENTATION: "Presentation",
  IMAGE: "Image",
  LINK: "External Link",
  TEXT: "Text",
};

interface ActionResult {
  success: boolean;
  error?: any;
}

export function TeacherMaterialList({
  materials,
  chapters,
  batchId,
  canManage,
}: {
  materials: TeacherMaterialItem[];
  chapters: TeacherChapterItem[];
  batchId: string;
  canManage: boolean;
}) {
  const [editingMaterial, setEditingMaterial] = useState<TeacherMaterialItem | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState<string>("ALL");

  const filtered = materials.filter((m) => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterState !== "ALL" && m.lifecycleState !== filterState) return false;
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
      const message = e instanceof Error ? e.message : "Unknown error";
      toast.error("Error", { description: message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
        <div className="flex flex-1 flex-col gap-4 md:flex-row md:flex-wrap md:items-end w-full">
          <Input
            placeholder="Search materials..."
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
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditingMaterial(null);
              setIsFormOpen(true);
            }}
          >
            Create Material
          </Button>
        )}
      </div>

      <div className="border rounded-md relative w-full overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No materials found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => {
                // Determine if this material can be mutated by the current teacher
                // If it's BATCH scope and teacher has canManage, they can mutate.
                // However, if the material is ARCHIVED, mutations are disabled per requirements.
                const isArchived = m.lifecycleState === "ARCHIVED";
                const isTrackScope = m.visibility === "CURRICULUM_TRACK";
                const canMutate = canManage && !isArchived && !isTrackScope;

                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <div>{m.title}</div>
                      {m.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {m.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {resourceTypeLabel[m.resourceType] || m.resourceType}
                      </Badge>
                      {isTrackScope && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          Track
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          m.lifecycleState === "PUBLISHED"
                            ? "default"
                            : m.lifecycleState === "ARCHIVED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {m.lifecycleState.charAt(0) + m.lifecycleState.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(m.createdAt), "PP")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {(m.resourceType === "DOCUMENT" ||
                          m.resourceType === "PRESENTATION" ||
                          m.resourceType === "IMAGE") &&
                          m.fileAssetId && (
                            <a
                              href={`/api/materials/${m.id}/download`}
                              target="_blank"
                              rel="noreferrer"
                              title="Download"
                              className={buttonVariants({
                                variant: "ghost",
                                size: "icon",
                              })}
                            >
                              <Download className="size-4" />
                            </a>
                          )}
                        {m.resourceType === "LINK" && m.externalLinkUrl && (
                          <a
                            href={m.externalLinkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={buttonVariants({ variant: "ghost", size: "sm" })}
                            title="Open Link"
                          >
                            Open
                          </a>
                        )}

                        {canMutate && (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className={buttonVariants({ variant: "ghost", size: "sm" })}
                            >
                              Actions
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingMaterial(m);
                                  setIsFormOpen(true);
                                }}
                              >
                                <Edit className="size-4 mr-2" />
                                Edit
                              </DropdownMenuItem>

                              {m.lifecycleState === "DRAFT" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleAction(
                                      () => publishTeacherMaterialAction(batchId, m.id),
                                      "Material published successfully",
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
                                    () => archiveTeacherMaterialAction(batchId, m.id),
                                    "Material archived successfully",
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

      <TeacherMaterialFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        material={editingMaterial}
        batchId={batchId}
        chapters={chapters}
      />
    </div>
  );
}
