"use client";

import React, { useState, useTransition } from "react";
import { Chapter, Topic } from "@prisma/client";
import { ReorderControls } from "./ReorderControls";
import {
  createChapterAction,
  updateChapterAction,
  archiveChapterAction,
  restoreChapterAction,
  moveChapterAction,
  deleteChapterAction,
  createTopicAction,
  updateTopicAction,
  archiveTopicAction,
  restoreTopicAction,
  moveTopicAction,
  deleteTopicAction,
} from "@/app/admin/curriculum/curriculum-tracks/[trackId]/actions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createChapterSchema, createTopicSchema } from "@/lib/validation/curriculum";
import { toast } from "sonner";
import { z } from "zod";
import { ChevronDown, ChevronRight, Plus, Archive, RotateCcw, Edit2, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type TopicModel = Topic;
type ChapterModel = Chapter & { topics: TopicModel[] };

export function ChapterTopicBuilder({
  trackId,
  initialChapters,
}: {
  trackId: string;
  initialChapters: ChapterModel[];
}) {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(initialChapters.map((c) => c.id)),
  );
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [addingTopicToChapterId, setAddingTopicToChapterId] = useState<string | null>(
    null,
  );
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [, startTransition] = useTransition();

  const toggleChapter = (id: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedChapters(newExpanded);
  };

  const handleMoveChapter = async (id: string, direction: "UP" | "DOWN") => {
    return moveChapterAction(trackId, id, direction);
  };

  const handleMoveTopic = async (
    chapterId: string,
    id: string,
    direction: "UP" | "DOWN",
  ) => {
    return moveTopicAction(trackId, chapterId, id, direction);
  };

  const [archiveChapterTarget, setArchiveChapterTarget] = useState<string | null>(null);
  const [archiveTopicTarget, setArchiveTopicTarget] = useState<{
    chapterId: string;
    topicId: string;
  } | null>(null);
  const [deleteChapterTarget, setDeleteChapterTarget] = useState<string | null>(null);
  const [deleteTopicTarget, setDeleteTopicTarget] = useState<{
    chapterId: string;
    topicId: string;
  } | null>(null);

  const handleArchiveChapter = () => {
    if (!archiveChapterTarget) return;
    const id = archiveChapterTarget;
    startTransition(async () => {
      const res = await archiveChapterAction(trackId, id);
      if (!res.success) toast.error("Error", { description: res.error });
      else toast.success("Success", { description: "Chapter archived" });
    });
    setArchiveChapterTarget(null);
  };

  const handleDeleteChapter = () => {
    if (!deleteChapterTarget) return;
    const id = deleteChapterTarget;
    startTransition(async () => {
      const res = await deleteChapterAction(trackId, id);
      if (!res.success) toast.error("Error", { description: res.error });
      else toast.success("Success", { description: "Chapter permanently deleted" });
    });
    setDeleteChapterTarget(null);
  };

  const handleRestoreChapter = (id: string) => {
    startTransition(async () => {
      const res = await restoreChapterAction(trackId, id);
      if (!res.success) toast.error("Error", { description: res.error });
      else toast.success("Success", { description: "Chapter restored" });
    });
  };

  const handleArchiveTopic = () => {
    if (!archiveTopicTarget) return;
    const { chapterId, topicId } = archiveTopicTarget;
    startTransition(async () => {
      const res = await archiveTopicAction(trackId, chapterId, topicId);
      if (!res.success) toast.error("Error", { description: res.error });
      else toast.success("Success", { description: "Topic archived" });
    });
    setArchiveTopicTarget(null);
  };

  const handleDeleteTopic = () => {
    if (!deleteTopicTarget) return;
    const { chapterId, topicId } = deleteTopicTarget;
    startTransition(async () => {
      const res = await deleteTopicAction(trackId, chapterId, topicId);
      if (!res.success) toast.error("Error", { description: res.error });
      else toast.success("Success", { description: "Topic permanently deleted" });
    });
    setDeleteTopicTarget(null);
  };

  const handleRestoreTopic = (chapterId: string, id: string) => {
    startTransition(async () => {
      const res = await restoreTopicAction(trackId, chapterId, id);
      if (!res.success) toast.error("Error", { description: res.error });
      else toast.success("Success", { description: "Topic restored" });
    });
  };

  // Determine the sequence of active items to know what isFirst/isLast means
  const activeChapters = initialChapters.filter((c) => !c.archivedAt);

  return (
    <div className="space-y-4">
      {initialChapters.length === 0 && !isAddingChapter && (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground bg-card/50">
          No chapters yet. Create one to get started.
        </div>
      )}

      {initialChapters.map((chapter) => {
        const activeTopics = chapter.topics.filter((t) => !t.archivedAt);
        const isActiveSequence = activeChapters.map((c) => c.id);
        const isFirstChapter = isActiveSequence[0] === chapter.id;
        const isLastChapter =
          isActiveSequence[isActiveSequence.length - 1] === chapter.id;

        return (
          <div
            key={chapter.id}
            className={`rounded-md border bg-card shadow-sm ${chapter.archivedAt ? "opacity-70" : ""}`}
          >
            <div className="flex items-center p-3 border-b border-border/50 hover:bg-muted/30 transition-colors">
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="mr-2 p-1 rounded-sm hover:bg-muted text-muted-foreground"
              >
                {expandedChapters.has(chapter.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {!chapter.archivedAt && (
                <div className="mr-4">
                  <ReorderControls
                    id={chapter.id}
                    isFirst={isFirstChapter}
                    isLast={isLastChapter}
                    onMove={handleMoveChapter}
                  />
                </div>
              )}

              <div className="flex-1 font-semibold text-lg flex items-center">
                {editingChapterId === chapter.id ? (
                  <ChapterForm
                    trackId={trackId}
                    chapter={chapter}
                    onClose={() => setEditingChapterId(null)}
                  />
                ) : (
                  <>
                    <span className="mr-3">{chapter.name}</span>
                    {chapter.archivedAt && (
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
                        Archived
                      </span>
                    )}
                  </>
                )}
              </div>

              {!editingChapterId && (
                <div className="flex items-center space-x-1 opacity-60 hover:opacity-100 transition-opacity">
                  {!chapter.archivedAt && (
                    <button
                      onClick={() => setAddingTopicToChapterId(chapter.id)}
                      className="p-1.5 hover:bg-accent rounded-sm text-sm flex items-center"
                      title="Add Topic"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setEditingChapterId(chapter.id)}
                    className="p-1.5 hover:bg-accent rounded-sm text-sm"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  {chapter.archivedAt ? (
                    <>
                      <button
                        onClick={() => handleRestoreChapter(chapter.id)}
                        className="p-1.5 hover:bg-accent rounded-sm text-sm text-green-600"
                        title="Restore"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteChapterTarget(chapter.id)}
                        className="p-1.5 hover:bg-accent rounded-sm text-sm text-destructive"
                        title="Delete permanently"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setArchiveChapterTarget(chapter.id)}
                      className="p-1.5 hover:bg-accent rounded-sm text-sm text-destructive"
                      title="Archive"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {expandedChapters.has(chapter.id) && (
              <div className="bg-muted/10 p-3 pl-12 space-y-2">
                {chapter.topics.map((topic) => {
                  const isActiveTopicSeq = activeTopics.map((t) => t.id);
                  const isFirstTopic = isActiveTopicSeq[0] === topic.id;
                  const isLastTopic =
                    isActiveTopicSeq[isActiveTopicSeq.length - 1] === topic.id;

                  return (
                    <div
                      key={topic.id}
                      className={`flex items-center p-2 rounded-md border bg-card hover:border-primary/30 transition-colors ${topic.archivedAt ? "opacity-70" : ""}`}
                    >
                      {!topic.archivedAt && !chapter.archivedAt && (
                        <div className="mr-3">
                          <ReorderControls
                            id={topic.id}
                            isFirst={isFirstTopic}
                            isLast={isLastTopic}
                            onMove={(id, dir) => handleMoveTopic(chapter.id, id, dir)}
                          />
                        </div>
                      )}

                      <div className="flex-1 text-sm font-medium">
                        {editingTopicId === topic.id ? (
                          <TopicForm
                            trackId={trackId}
                            chapterId={chapter.id}
                            topic={topic}
                            onClose={() => setEditingTopicId(null)}
                          />
                        ) : (
                          <div className="flex items-center">
                            <span className="mr-2">{topic.name}</span>
                            {topic.archivedAt && (
                              <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">
                                Archived
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {!editingTopicId && (
                        <div className="flex items-center space-x-1 opacity-50 hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingTopicId(topic.id)}
                            className="p-1.5 hover:bg-accent rounded-sm text-sm"
                            title="Edit"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          {topic.archivedAt ? (
                            <>
                              <button
                                onClick={() => handleRestoreTopic(chapter.id, topic.id)}
                                className="p-1.5 hover:bg-accent rounded-sm text-sm text-green-600"
                                title="Restore"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteTopicTarget({
                                    chapterId: chapter.id,
                                    topicId: topic.id,
                                  })
                                }
                                className="p-1.5 hover:bg-accent rounded-sm text-sm text-destructive"
                                title="Delete permanently"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() =>
                                setArchiveTopicTarget({
                                  chapterId: chapter.id,
                                  topicId: topic.id,
                                })
                              }
                              className="p-1.5 hover:bg-accent rounded-sm text-sm text-destructive"
                              title="Archive"
                            >
                              <Archive className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {chapter.topics.length === 0 && addingTopicToChapterId !== chapter.id && (
                  <div className="text-sm text-muted-foreground italic py-2 pl-2">
                    No topics yet.
                  </div>
                )}

                {addingTopicToChapterId === chapter.id && (
                  <div className="p-2 border border-primary/30 rounded-md bg-card">
                    <TopicForm
                      trackId={trackId}
                      chapterId={chapter.id}
                      onClose={() => setAddingTopicToChapterId(null)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {isAddingChapter && (
        <div className="rounded-md border border-primary/30 bg-card p-4 shadow-sm">
          <ChapterForm trackId={trackId} onClose={() => setIsAddingChapter(false)} />
        </div>
      )}

      {!isAddingChapter && (
        <button
          onClick={() => setIsAddingChapter(true)}
          className="flex w-full items-center justify-center space-x-2 rounded-md border-2 border-dashed p-4 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Chapter</span>
        </button>
      )}

      <ConfirmDialog
        open={!!archiveChapterTarget}
        onOpenChange={(open) => !open && setArchiveChapterTarget(null)}
        title="Archive chapter?"
        description="Are you sure you want to archive this chapter? It can be restored later."
        confirmLabel="Archive"
        onConfirm={handleArchiveChapter}
      />

      <ConfirmDialog
        open={!!archiveTopicTarget}
        onOpenChange={(open) => !open && setArchiveTopicTarget(null)}
        title="Archive topic?"
        description="Are you sure you want to archive this topic? It can be restored later."
        confirmLabel="Archive"
        onConfirm={handleArchiveTopic}
      />

      <ConfirmDialog
        open={!!deleteChapterTarget}
        onOpenChange={(open) => !open && setDeleteChapterTarget(null)}
        title="Permanently delete chapter?"
        description="This action cannot be undone. The chapter will be removed forever. This is only allowed if it has no topics, questions, study materials, homework, or tests linked to it."
        confirmLabel="Delete permanently"
        confirmVariant="destructive"
        onConfirm={handleDeleteChapter}
      />

      <ConfirmDialog
        open={!!deleteTopicTarget}
        onOpenChange={(open) => !open && setDeleteTopicTarget(null)}
        title="Permanently delete topic?"
        description="This action cannot be undone. The topic will be removed forever. This is only allowed if it has no questions, study materials, homework, or tests linked to it."
        confirmLabel="Delete permanently"
        confirmVariant="destructive"
        onConfirm={handleDeleteTopic}
      />
    </div>
  );
}

function ChapterForm({
  trackId,
  chapter,
  onClose,
}: {
  trackId: string;
  chapter?: ChapterModel;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof createChapterSchema>>({
    resolver: zodResolver(createChapterSchema),
    defaultValues: { curriculumTrackId: trackId, name: chapter?.name || "" },
  });

  const onSubmit = (data: z.infer<typeof createChapterSchema>) => {
    startTransition(async () => {
      const res = chapter
        ? await updateChapterAction(trackId, chapter.id, { name: data.name })
        : await createChapterAction(trackId, data);

      if (!res.success) toast.error("Error", { description: res.error });
      else {
        toast.success("Success", { description: chapter ? "Chapter updated" : "Chapter created" });
        onClose();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full items-start space-x-2">
      <div className="flex-1">
        <input
          {...register("name")}
          autoFocus
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Chapter Name"
        />
        {errors.name && (
          <span className="text-xs text-destructive mt-1 block">
            {errors.name.message as string}
          </span>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
      >
        {chapter ? "Save" : "Create"}
      </button>
      <button
        type="button"
        onClick={onClose}
        disabled={isPending}
        className="h-9 px-3 rounded-md bg-muted text-muted-foreground text-sm font-medium"
      >
        Cancel
      </button>
    </form>
  );
}

function TopicForm({
  trackId,
  chapterId,
  topic,
  onClose,
}: {
  trackId: string;
  chapterId: string;
  topic?: TopicModel;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof createTopicSchema>>({
    resolver: zodResolver(createTopicSchema),
    defaultValues: { chapterId: chapterId, name: topic?.name || "" },
  });

  const onSubmit = (data: z.infer<typeof createTopicSchema>) => {
    startTransition(async () => {
      const res = topic
        ? await updateTopicAction(trackId, chapterId, topic.id, { name: data.name })
        : await createTopicAction(trackId, chapterId, data);

      if (!res.success) toast.error("Error", { description: res.error });
      else {
        toast.success("Success", { description: topic ? "Topic updated" : "Topic created" });
        onClose();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full items-start space-x-2">
      <div className="flex-1">
        <input
          {...register("name")}
          autoFocus
          className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Topic Name"
        />
        {errors.name && (
          <span className="text-xs text-destructive mt-1 block">
            {errors.name.message as string}
          </span>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
      >
        {topic ? "Save" : "Create"}
      </button>
      <button
        type="button"
        onClick={onClose}
        disabled={isPending}
        className="h-8 px-3 rounded-md bg-muted text-muted-foreground text-xs font-medium"
      >
        Cancel
      </button>
    </form>
  );
}
