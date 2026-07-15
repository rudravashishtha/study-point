/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { TestType } from "@prisma/client";
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
import { createAdminTestAction, updateAdminTestAction } from "@/app/admin/tests/actions";
import { TestUpload } from "@/components/upload/TestUpload";
import { SubmitButton } from "@/components/ui/submit-button";

interface TestFormBatch {
  id: string;
  name: string;
  archivedAt?: Date | string | null;
}

interface TestFormSession {
  id: string;
  name: string;
}

interface TestFormTrack {
  id: string;
  name?: string;
}

interface TestFormData {
  id: string;
  title: string;
  description?: string | null;
  batchId: string;
  testType: string;
  testDate: string | Date;
  durationMinutes?: number | null;
  maximumMarks: number;
  syllabusDescription?: string | null;
  chapterId?: string | null;
  topicId?: string | null;
  questionPaperFileId?: string | null;
  fileAssetId?: string | null;
}

interface TestFormPayload {
  batchId: string;
  title: string;
  description: string | null;
  testType: TestType;
  testDate: string;
  maximumMarks: number;
  durationMinutes: number | null;
  syllabusDescription: string | null;
  chapterId: string | null;
  topicId: string | null;
  questionPaperFileId?: string;
}

export function TestFormDialog({
  open,
  onOpenChange,
  test,
  batches,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test?: TestFormData;
  sessions: TestFormSession[];
  batches: TestFormBatch[];
  tracks: TestFormTrack[];
}) {
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [batchId, setBatchId] = useState<string>("");
  const [testType, setTestType] = useState<string>("CHAPTER_TEST");
  const [testDate, setTestDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [maximumMarks, setMaximumMarks] = useState<string>("");
  const [syllabusDescription, setSyllabusDescription] = useState("");
  const [chapterId, setChapterId] = useState<string>("none");
  const [topicId, setTopicId] = useState<string>("none");
  const [questionPaperFileId, setQuestionPaperFileId] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(test?.title || "");
      setDescription(test?.description || "");
      setBatchId(test?.batchId || "");
      setTestType(test?.testType || "CHAPTER_TEST");
      setTestDate(
        test?.testDate ? new Date(test.testDate).toISOString().slice(0, 16) : "",
      );
      setDurationMinutes(test?.durationMinutes?.toString() || "");
      setMaximumMarks(test?.maximumMarks?.toString() || "");
      setSyllabusDescription(test?.syllabusDescription || "");
      setChapterId(test?.chapterId || "none");
      setTopicId(test?.topicId || "none");
      setQuestionPaperFileId(test?.questionPaperFileId || "");
    }
  }, [open, test]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      if (!batchId) throw new Error("Batch is required");
      if (!testDate) throw new Error("Test date is required");
      if (!maximumMarks || parseInt(maximumMarks) < 1)
        throw new Error("Valid maximum marks is required");

      const payload: TestFormPayload = {
        batchId,
        title: title.trim(),
        description: description.trim() || null,
        testType: testType as TestType,
        testDate: new Date(testDate).toISOString(),
        maximumMarks: parseInt(maximumMarks),
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
        syllabusDescription: syllabusDescription.trim() || null,
        chapterId: chapterId !== "none" ? chapterId : null,
        topicId: topicId !== "none" ? topicId : null,
      };

      if (questionPaperFileId) payload.questionPaperFileId = questionPaperFileId;

      const res = test
        ? await updateAdminTestAction(test.id, payload)
        : await createAdminTestAction(payload);

      if (!res.success) {
        throw new Error(typeof res.error === 'string' ? res.error : (res.error as /* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: Server action boundary */ any)?.message || 'Unknown error');
      }
      toast.success("Success", { description: "Test saved" });
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
          <DialogTitle>{test ? "Edit Test" : "Create Test"}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <form id="test-form" onSubmit={handleSubmit} className="space-y-8">
            
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
                    disabled={!!test}
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
                
                <div className="space-y-2">
                  <Label htmlFor="testType">Test Type</Label>
                  <Select value={testType} onValueChange={(v) => v && setTestType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CHAPTER_TEST">Chapter Test</SelectItem>
                      <SelectItem value="UNIT_TEST">Unit Test</SelectItem>
                      <SelectItem value="FULL_SYLLABUS_TEST">Full Syllabus Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testDate">Date & Time</Label>
                  <Input
                    id="testDate"
                    type="datetime-local"
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Evaluation Details */}
            <section className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">Evaluation Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maximumMarks">Maximum Marks</Label>
                  <Input
                    id="maximumMarks"
                    type="number"
                    min={1}
                    value={maximumMarks}
                    onChange={(e) => setMaximumMarks(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">Duration (min, Optional)</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min={1}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Syllabus & Curriculum */}
            <section className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">Syllabus & Curriculum</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label htmlFor="syllabusDescription">Syllabus Description (Optional)</Label>
                  <Textarea
                    id="syllabusDescription"
                    value={syllabusDescription}
                    onChange={(e) => setSyllabusDescription(e.target.value)}
                    maxLength={2000}
                    rows={3}
                    placeholder="Describe what topics are covered..."
                  />
                </div>
                
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
                <Label>Question Paper Upload (Optional)</Label>
                {test?.fileAssetId && !questionPaperFileId && (
                  <div className="text-sm text-muted-foreground mb-2">
                    Currently attached. Upload a new file below to replace it.
                  </div>
                )}
                {batchId ? (
                  <TestUpload
                    targetBatchId={batchId}
                    onUploadSuccess={(fid) => {
                      setQuestionPaperFileId(fid);
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
          <SubmitButton type="submit" form="test-form" pending={loading}>
            {loading ? "Saving..." : "Save Test"}
          </SubmitButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
