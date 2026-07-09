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

export function HomeworkFormDialog({
  open,
  onOpenChange,
  homework,
  sessions,
  batches,
  tracks,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homework?: any;
  sessions: any[];
  batches: any[];
  tracks: any[];
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

      const payload: any = {
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
        throw new Error(res.error.message);
      }
      toast.success("Success", { description: "Homework saved" });
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Error", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{homework ? "Edit Homework" : "Create Homework"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                    {b.archivedAt ? " (Archived)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <div className="col-span-2 text-sm text-red-500">{dateError}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <div className="space-y-2">
            <Label>File Attachment (Optional)</Label>
            {homework?.fileAssetId && !fileAssetId && (
              <div className="text-sm text-muted-foreground mb-2">
                Currently attached. Upload a new file below to replace it.
              </div>
            )}
            {batchId && (
              <HomeworkUpload
                targetBatchId={batchId}
                onUploadSuccess={(fid) => {
                  setFileAssetId(fid);
                  toast.success("File uploaded successfully");
                }}
                onUploadError={(err) => toast.error(err)}
              />
            )}
            {!batchId && (
              <p className="text-sm text-muted-foreground">
                Select a batch first to enable file upload.
              </p>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Homework"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
