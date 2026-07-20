"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudyMaterialResourceType } from "@prisma/client";
import type { CreateStudyMaterialInput } from "@/server/services/study-materials";
import type { TeacherMaterialItem, TeacherChapterItem } from "./TeacherMaterialList";
import { toast } from "sonner";
import {
  createTeacherMaterialAction,
  updateTeacherMaterialAction,
} from "@/app/teacher/batches/[batchId]/actions";
import { StudyMaterialUpload } from "@/components/upload/StudyMaterialUpload";
import { SubmitButton } from "@/components/ui/submit-button";

type TeacherMaterialCreateInput = Omit<
  CreateStudyMaterialInput,
  "visibility" | "batchId" | "academicSessionId" | "curriculumTrackId"
>;

export function TeacherMaterialFormDialog({
  open,
  onOpenChange,
  material,
  batchId,
  chapters,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: TeacherMaterialItem | null;
  batchId: string;
  chapters: TeacherChapterItem[];
}) {
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState<StudyMaterialResourceType>("DOCUMENT");

  const [chapterId, setChapterId] = useState<string>("none");
  const [topicId, setTopicId] = useState<string>("none");

  const [externalLinkUrl, setExternalLinkUrl] = useState("");
  const [fileAssetId, setFileAssetId] = useState("");

  useEffect(() => {
    if (open) {
      setTitle((material?.title as string) || "");
      setDescription((material?.description as string) || "");
      setResourceType(
        (material?.resourceType as StudyMaterialResourceType) || "DOCUMENT",
      );
      setChapterId((material?.chapterId as string) || "none");
      setTopicId((material?.topicId as string) || "none");
      setExternalLinkUrl((material?.externalLinkUrl as string) || "");
      setFileAssetId((material?.fileAssetId as string) || "");
    }
  }, [open, material]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: TeacherMaterialCreateInput = {
        title,
        description: description || null,
        resourceType,
        chapterId: chapterId !== "none" ? chapterId : null,
        topicId: topicId !== "none" ? topicId : null,
      };

      if (["DOCUMENT", "PRESENTATION", "IMAGE"].includes(resourceType)) {
        if (!fileAssetId && (!material || material.resourceType !== resourceType)) {
          throw new Error("File upload is required for this resource type");
        }
        if (fileAssetId) payload.fileAssetId = fileAssetId;
      } else if (resourceType === "LINK") {
        if (!externalLinkUrl) throw new Error("Link URL is required");
        payload.externalLinkUrl = externalLinkUrl;
      } else if (resourceType === "TEXT") {
        // text not strictly enforced by schema other than not needing file/link
      }

      const res = material
        ? await updateTeacherMaterialAction(batchId, material.id, payload)
        : await createTeacherMaterialAction(batchId, payload);

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
  const selectedChapter = chapters.find((c) => c.id === chapterId);
  const topics = selectedChapter?.topics || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 flex flex-col overflow-hidden max-h-[90vh]">
        <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
          <DialogTitle>{material ? "Edit Material" : "Create Material"}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <form id="teacher-material-form" onSubmit={handleSubmit} className="space-y-8">
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
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label>Resource Type</Label>
                  <Select
                    value={resourceType}
                    onValueChange={(v) => {
                      setResourceType(v as StudyMaterialResourceType);
                      setFileAssetId("");
                      setExternalLinkUrl("");
                    }}
                    disabled={!!material}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOCUMENT">Document (PDF/Word)</SelectItem>
                      <SelectItem value="PRESENTATION">Presentation (PPT)</SelectItem>
                      <SelectItem value="IMAGE">Image</SelectItem>
                      <SelectItem value="LINK">External Link</SelectItem>
                      <SelectItem value="TEXT">Text Content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Curriculum Mapping */}
            <section className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
                Curriculum Mapping
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Chapter (Optional)</Label>
                  <Select
                    value={chapterId}
                    onValueChange={(val) => {
                      setChapterId(val || "none");
                      setTopicId("none");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      {chapters.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No chapters available
                        </SelectItem>
                      ) : (
                        <>
                          <SelectItem value="none">-- No Chapter --</SelectItem>
                          {chapters.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Topic (Optional)</Label>
                  <Select
                    value={topicId}
                    onValueChange={(val) => setTopicId(val || "none")}
                    disabled={chapterId === "none" || topics.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No topics available
                        </SelectItem>
                      ) : (
                        <>
                          <SelectItem value="none">-- No Topic --</SelectItem>
                          {topics.map((t: { id: string; name: string }) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Content & Attachments */}
            {(isUploadRequired || resourceType === "LINK") && (
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
                  Content & Attachments
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resourceType === "LINK" && (
                    <div className="space-y-2 col-span-1 md:col-span-2">
                      <Label htmlFor="externalLinkUrl">Link URL</Label>
                      <Input
                        id="externalLinkUrl"
                        type="url"
                        value={externalLinkUrl}
                        onChange={(e) => setExternalLinkUrl(e.target.value)}
                        required
                        placeholder="https://..."
                      />
                    </div>
                  )}

                  {isUploadRequired && (
                    <div className="space-y-2 col-span-1 md:col-span-2">
                      <Label>File Upload</Label>
                      <StudyMaterialUpload
                        usageCategory="STUDY_MATERIAL"
                        uploadScope="BATCH"
                        targetBatchId={batchId}
                        onUploadSuccess={(fileAssetId) => {
                          setFileAssetId(fileAssetId);
                          toast.success("Success", { description: "File uploaded successfully" });
                        }}
                        onUploadError={(error) => {
                          toast.error("Error", { description: error });
                        }}
                      />
                      {fileAssetId && (
                        <p className="text-sm text-green-600 mt-2">
                          New file staged for save.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}
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
          <SubmitButton type="submit" form="teacher-material-form" pending={loading}>
            {loading ? "Saving..." : "Save Material"}
          </SubmitButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
