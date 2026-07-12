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
import { Button } from "@/components/ui/button";
import { Download, Edit, Archive, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  publishAdminMaterialAction,
  archiveAdminMaterialAction,
} from "@/app/admin/materials/actions";
import { MaterialFormDialog } from "./MaterialFormDialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudyMaterialVisibility, StudyMaterialResourceType } from "@prisma/client";
import type { MaterialFormBatch, MaterialFormTrack } from "./MaterialFormDialog";

interface MaterialListItem {
  id: string;
  title: string;
  description: string | null;
  resourceType: StudyMaterialResourceType;
  visibility: StudyMaterialVisibility;
  lifecycleState: string;
  createdAt: string | Date;
  batchId: string | null;
  academicSessionId: string;
  curriculumTrackId: string;
  externalLinkUrl: string | null;
  fileAssetId: string | null;
}

interface MaterialListSession {
  id: string;
  name: string;
}

interface MaterialActionResult {
  success: boolean;
  error?: { message: string };
}

export function MaterialList({
  materials,
  sessions,
  batches,
  tracks,
}: {
  materials: MaterialListItem[];
  sessions: MaterialListSession[];
  batches: MaterialFormBatch[];
  tracks: MaterialFormTrack[];
}) {
  const [editingMaterial, setEditingMaterial] = useState<MaterialListItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState<string>("ALL");

  const filtered = materials.filter((m) => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterState !== "ALL" && m.lifecycleState !== filterState) return false;
    return true;
  });

  const handleAction = async (
    action: () => Promise<MaterialActionResult>,
    successMsg: string,
  ) => {
    try {
      const res = await action();
      if (!res.success) {
        toast.error("Error", { description: res.error?.message });
        return;
      }
      toast.success("Success", { description: successMsg });
    } catch (e: unknown) {
      toast.error("Error", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 items-center w-full sm:w-auto">
          <Input
            placeholder="Search materials..."
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
            setEditingMaterial(null);
            setIsFormOpen(true);
          }}
        >
          Create Material
        </Button>
      </div>

      <div className="border rounded-md relative w-full overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  No materials found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell
                    className="font-medium max-w-[200px] truncate"
                    title={m.title}
                  >
                    {m.title}
                  </TableCell>
                  <TableCell>{m.resourceType}</TableCell>
                  <TableCell>{m.visibility}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        m.lifecycleState === "PUBLISHED"
                          ? "default"
                          : m.lifecycleState === "DRAFT"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {m.lifecycleState}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(m.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="sm">
                          Options
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {m.fileAssetId && (
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(
                                `/api/materials/${m.id}/download`,
                                "_blank",
                                "noopener,noreferrer",
                              )
                            }
                          >
                            <Download className="mr-2 h-4 w-4" /> Download
                          </DropdownMenuItem>
                        )}
                        {m.lifecycleState !== "ARCHIVED" && (
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingMaterial(m);
                              setIsFormOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        )}
                        {m.lifecycleState === "DRAFT" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleAction(
                                () => publishAdminMaterialAction(m.id),
                                "Material published",
                              )
                            }
                          >
                            <CheckCircle className="mr-2 h-4 w-4" /> Publish
                          </DropdownMenuItem>
                        )}
                        {m.lifecycleState !== "ARCHIVED" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleAction(
                                () => archiveAdminMaterialAction(m.id),
                                "Material archived",
                              )
                            }
                          >
                            <Archive className="mr-2 h-4 w-4" /> Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <MaterialFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        material={editingMaterial}
        sessions={sessions}
        batches={batches}
        tracks={tracks}
      />
    </div>
  );
}
