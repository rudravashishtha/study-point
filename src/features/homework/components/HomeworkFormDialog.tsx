/* eslint-disable react-hooks/set-state-in-effect */
"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  createAdminHomeworkAction,
  updateAdminHomeworkAction,
} from "@/app/admin/homework/actions";
import { HomeworkUpload } from "@/components/upload/HomeworkUpload";
import { SubmitButton } from "@/components/ui/submit-button";

interface HomeworkFormBatch {
  id: string;
  name: string;
  archivedAt?: Date | string | null;
}

interface HomeworkFormSession {
  id: string;
  name: string;
}

interface HomeworkFormTrack {
  id: string;
  name?: string | null;
}

export interface HomeworkFormData {
  id: string;
  title: string;
  description?: string | null;
  batchId: string;
  assignedDate: string | Date;
  dueDate: string | Date;
  chapterId?: string | null;
  topicId?: string | null;
  fileAssetId?: string | null;
}

interface HomeworkFormPayload {
  batchId: string;
  title: string;
  description: string | null;
  assignedDate: string;
  dueDate: string;
  chapterId: string | null;
  topicId: string | null;
  fileAssetId?: string;
}

export function HomeworkFormDialog({
  open,
  onOpenChange,
  homework,
  batches,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homework?: HomeworkFormData | null;
  sessions: HomeworkFormSession[];
  batches: HomeworkFormBatch[];
  tracks: HomeworkFormTrack[];
}) {
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [batchId, setBatchId] = useState<string>("");
  const [chapterId, setChapterId] = useState<string>("none");
  const [topicId, setTopicId] = useState<string>("none");
  const [assignedDate, setAssignedDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [fileAssetId, setFileAssetId] = useState("");

  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(homework?.title || "");
      setDescription(homework?.description || "");
      setBatchId(homework?.batchId || "");
      setChapterId(homework?.chapterId || "none");
      setTopicId(homework?.topicId || "none");
      setAssignedDate(
        homework?.assignedDate
          ? new Date(homework.assignedDate).toISOString().split("T")[0]
          : "",
      );
      setDueDate(
        homework?.dueDate ? new Date(homework.dueDate).toISOString().split("T")[0] : "",
      );
      setFileAssetId(homework?.fileAssetId || "");
      setDateError(null);
    }
  }, [open, homework]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDateError(null);

    if (dueDate && assignedDate && dueDate < assignedDate) {
      setDateError("Due date must be on or after assigned date");
      setLoading(false);
      return;
    }

    try {
      if (!batchId) throw new Error("Batch is required");
      if (!assignedDate) throw new Error("Assigned date is required");
      if (!dueDate) throw new Error("Due date is required");

      const payload: HomeworkFormPayload = {
        batchId,
        title: title.trim(),
        description: description.trim() || null,
        assignedDate,
        dueDate,
        chapterId: chapterId !== "none" ? chapterId : null,
        topicId: topicId !== "none" ? topicId : null,
      };

      if (fileAssetId) payload.fileAssetId = fileAssetId;

      const res = homework
        ? await updateAdminHomeworkAction(homework.id, payload)
        : await createAdminHomeworkAction(payload);

      if (!res.success) {
        throw new Error(typeof res.error === 'string' ? res.error : (res.error as /* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: Server action boundary */ any)?.message || 'Unknown error');
      }
      toast.success("Success", { description: "Homework saved" });
      onOpenChange(false);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast.error("Error", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 flex flex-col overflow-hidden max-h-[90vh]">
        <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
          <DialogTitle>{homework ? "Edit Homework" : "Create Homework"}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <form id="homework-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* General Information */}
            <section className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">General Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    minLength={3}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch">Batch</Label>
                  <Select
                    value={batchId}
                    onValueChange={(v) => v && setBatchId(v)}
                    disabled={!!homework}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.length === 0 ? (
                        <SelectItem value="none" disabled>No batches available</SelectItem>
                      ) : (
                        batches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                            {b.archivedAt ? " (Archived)" : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={2000}
                    rows={3}
                  />
                </div>
              </div>
            </section>

            {/* Scheduling */}
            <section className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">Scheduling</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignedDate">Assigned Date</Label>
                  <Input
                    id="assignedDate"
                    type="date"
                    value={assignedDate}
                    onChange={(e) => setAssignedDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
                {dateError && (
                  <div className="col-span-1 md:col-span-2 text-sm text-red-500">{dateError}</div>
                )}
              </div>
            </section>

            {/* Curriculum Mapping */}
            <section className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">Curriculum Mapping</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
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
                      <SelectItem value="none">-- No Chapter --</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Topic (Optional)</Label>
                  <Select
                    value={topicId}
                    onValueChange={(val) => setTopicId(val || "none")}
                    disabled
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- No Topic --</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Attachments */}
            <section className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">Attachments</h3>
              <div className="space-y-2">
                <Label>File Attachment (Optional)</Label>
                {homework?.fileAssetId && !fileAssetId && (
                  <div className="text-sm text-muted-foreground mb-2">
                    Currently attached. Upload a new file below to replace it.
                  </div>
                )}
                {batchId ? (
                  <HomeworkUpload
                    targetBatchId={batchId}
                    onUploadSuccess={(fid) => {
                      setFileAssetId(fid);
                      toast.success("File uploaded successfully");
                    }}
                    onUploadError={(err) => toast.error(err)}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground bg-muted p-4 rounded-md border text-center">
                    Select a batch first to enable file upload.
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
          <SubmitButton type="submit" form="homework-form" pending={loading}>
            {loading ? "Saving..." : "Save Homework"}
          </SubmitButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
