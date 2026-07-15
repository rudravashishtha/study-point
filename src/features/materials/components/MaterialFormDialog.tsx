/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudyMaterialVisibility, StudyMaterialResourceType } from "@prisma/client";
import type { CreateStudyMaterialInput } from "@/server/services/study-materials";
import { toast } from "sonner";
import {
  createAdminMaterialAction,
  updateAdminMaterialAction,
} from "@/app/admin/materials/actions";
import { StudyMaterialUpload } from "@/components/upload/StudyMaterialUpload";
import { SubmitButton } from "@/components/ui/submit-button";

interface MaterialFormData {
  id: string;
  title: string;
  description: string | null;
  visibility: StudyMaterialVisibility;
  resourceType: StudyMaterialResourceType;
  batchId: string | null;
  academicSessionId: string;
  curriculumTrackId: string;
  externalLinkUrl: string | null;
  fileAssetId: string | null;
}

interface MaterialFormSession {
  id: string;
  name: string;
}

export interface MaterialFormBatch {
  id: string;
  name: string;
  archivedAt: Date | string | null;
  academicSessionId: string;
  curriculumTrackId: string;
}

export interface MaterialFormTrack {
  id: string;
  name?: string | null;
}

export function MaterialFormDialog({
  open,
  onOpenChange,
  material,
  sessions,
  batches,
  tracks,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: MaterialFormData | null;
  sessions: MaterialFormSession[];
  batches: MaterialFormBatch[];
  tracks: MaterialFormTrack[];
}) {
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] =
    useState<StudyMaterialVisibility>("CURRICULUM_TRACK");
  const [resourceType, setResourceType] = useState<StudyMaterialResourceType>("DOCUMENT");
  const [batchId, setBatchId] = useState<string>("");
  const [academicSessionId, setAcademicSessionId] = useState<string>("");
  const [curriculumTrackId, setCurriculumTrackId] = useState<string>("");

  const [externalLinkUrl, setExternalLinkUrl] = useState("");
  const [fileAssetId, setFileAssetId] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(material?.title || "");
      setDescription(material?.description || "");
      setVisibility(material?.visibility || "CURRICULUM_TRACK");
      setResourceType(material?.resourceType || "DOCUMENT");
      setBatchId(material?.batchId || "");
      setAcademicSessionId(material?.academicSessionId || "");
      setCurriculumTrackId(material?.curriculumTrackId || "");
      setExternalLinkUrl(material?.externalLinkUrl || "");
      setFileAssetId(material?.fileAssetId || "");
    }
  }, [open, material]);

  // Derived logic for Batch scope
  useEffect(() => {
    if (visibility === "BATCH" && batchId) {
      const b = batches.find((x) => x.id === batchId);
      if (b) {
        setAcademicSessionId(b.academicSessionId);
        setCurriculumTrackId(b.curriculumTrackId);
      }
    }
  }, [batchId, visibility, batches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: CreateStudyMaterialInput = {
        title,
        description: description || null,
        visibility,
        resourceType,
        academicSessionId: "",
        curriculumTrackId: "",
        batchId: null,
      };

      if (visibility === "BATCH") {
        if (!batchId) throw new Error("Batch is required");
        payload.batchId = batchId;
        payload.academicSessionId = academicSessionId;
        payload.curriculumTrackId = curriculumTrackId;
      } else {
        if (!academicSessionId || !curriculumTrackId)
          throw new Error("Session and Track required");
        payload.academicSessionId = academicSessionId;
        payload.curriculumTrackId = curriculumTrackId;
      }

      if (["DOCUMENT", "PRESENTATION", "IMAGE"].includes(resourceType)) {
        if (!fileAssetId && (!material || material.resourceType !== resourceType)) {
          throw new Error("File upload is required for this resource type");
        }
        if (fileAssetId) payload.fileAssetId = fileAssetId;
      } else if (resourceType === "LINK") {
        if (!externalLinkUrl) throw new Error("Link URL is required");
        payload.externalLinkUrl = externalLinkUrl;
      }

      const res = material
        ? await updateAdminMaterialAction(material.id, payload)
        : await createAdminMaterialAction(payload);

      if (!res.success) {
        throw new Error(
          typeof res.error === "string"
            ? res.error
            : (
                res.error as /* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: Server action boundary */ any
              )?.message || "Unknown error",
        );
      }
      toast.success("Success", { description: "Material saved" });
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error("Error", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const isUploadRequired = ["DOCUMENT", "PRESENTATION", "IMAGE"].includes(resourceType);
  const activeBatches = batches.filter((b) => !b.archivedAt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 flex flex-col overflow-hidden max-h-[90vh]">
        <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
          <DialogTitle>{material ? "Edit Material" : "Create Material"}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <form id="material-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Scope & Targeting */}
            <section className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
                Scope & Targeting
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label>Visibility Scope</Label>
                  <Select
                    value={visibility}
                    onValueChange={(v) => {
                      setVisibility(v as StudyMaterialVisibility);
                      setBatchId("");
                    }}
                    disabled={!!material} // Prevent widening/swapping
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CURRICULUM_TRACK">
                        Curriculum Track (All Batches)
                      </SelectItem>
                      <SelectItem value="BATCH">Specific Batch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {visibility === "BATCH" && (
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label>Select Batch</Label>
                    <Select
                      value={batchId}
                      onValueChange={(v) => v && setBatchId(v)}
                      disabled={!!material}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeBatches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {visibility === "CURRICULUM_TRACK" && (
                  <>
                    <div className="space-y-2">
                      <Label>Academic Session</Label>
                      <Select
                        value={academicSessionId}
                        onValueChange={(v) => v && setAcademicSessionId(v)}
                        disabled={!!material}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Session" />
                        </SelectTrigger>
                        <SelectContent>
                          {sessions.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Curriculum Track</Label>
                      <Select
                        value={curriculumTrackId}
                        onValueChange={(v) => v && setCurriculumTrackId(v)}
                        disabled={!!material}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Track" />
                        </SelectTrigger>
                        <SelectContent>
                          {tracks.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name || "Track"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Material Details */}
            <section className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
                Material Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label>Resource Type</Label>
                  <Select
                    value={resourceType}
                    onValueChange={(v) => setResourceType(v as StudyMaterialResourceType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOCUMENT">Document (PDF/Doc)</SelectItem>
                      <SelectItem value="PRESENTATION">Presentation</SelectItem>
                      <SelectItem value="IMAGE">Image</SelectItem>
                      <SelectItem value="LINK">External Link</SelectItem>
                      <SelectItem value="TEXT">Text Content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isUploadRequired && (
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label>File Attachment</Label>
                    {material && material.fileAssetId && !fileAssetId && (
                      <div className="text-sm text-muted-foreground mb-2">
                        Currently attached. Upload a new file below to replace it.
                      </div>
                    )}
                    <StudyMaterialUpload
                      usageCategory="STUDY_MATERIAL"
                      uploadScope={visibility}
                      targetBatchId={visibility === "BATCH" ? batchId : null}
                      targetSessionId={
                        visibility === "CURRICULUM_TRACK" ? academicSessionId : null
                      }
                      targetTrackId={
                        visibility === "CURRICULUM_TRACK" ? curriculumTrackId : null
                      }
                      onUploadSuccess={setFileAssetId}
                      onUploadError={(e) =>
                        toast.error("Upload Failed", { description: e })
                      }
                    />
                  </div>
                )}

                {resourceType === "LINK" && (
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label>HTTPS URL</Label>
                    <Input
                      type="url"
                      value={externalLinkUrl}
                      onChange={(e) => setExternalLinkUrl(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>
            </section>
          </form>
        </div>

        <div className="m-0 p-4 sm:p-6 border-t bg-muted/40 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <SubmitButton type="submit" form="material-form" pending={loading}>
            {loading ? "Saving..." : "Save Material"}
          </SubmitButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
