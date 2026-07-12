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
  createTopicAction,
  updateTopicAction,
  archiveTopicAction,
  restoreTopicAction,
  moveTopicAction,
} from "@/app/admin/curriculum/curriculum-tracks/[trackId]/actions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createChapterSchema, createTopicSchema } from "@/lib/validation/curriculum";
import { toast } from "sonner";
import { z } from "zod";
import { ChevronDown, ChevronRight, Plus, Archive, RotateCcw, Edit2 } from "lucide-react";

type TopicModel = Topic;
type ChapterModel = Chapter & { topics: TopicModel[] };

export function ChapterTopicBuilder({
  trackId,
  initialChapters,
}: {
  trackId: string;
  initialChapters: ChapterModel[];
  archiveState: string;
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

  const handleArchiveChapter = (id: string) => {
    if (!confirm("Archive chapter?")) return;
    startTransition(async () => {
      const res = await archiveChapterAction(trackId, id);
      if (!res.success) toast.error(res.error);
      else toast.success("Chapter archived");
    });
  };

  const handleRestoreChapter = (id: string) => {
    startTransition(async () => {
      const res = await restoreChapterAction(trackId, id);
      if (!res.success) toast.error(res.error);
      else toast.success("Chapter restored");
    });
  };

  const handleArchiveTopic = (chapterId: string, id: string) => {
    if (!confirm("Archive topic?")) return;
    startTransition(async () => {
      const res = await archiveTopicAction(trackId, chapterId, id);
      if (!res.success) toast.error(res.error);
      else toast.success("Topic archived");
    });
  };

  const handleRestoreTopic = (chapterId: string, id: string) => {
    startTransition(async () => {
      const res = await restoreTopicAction(trackId, chapterId, id);
      if (!res.success) toast.error(res.error);
      else toast.success("Topic restored");
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
                    <button
                      onClick={() => handleRestoreChapter(chapter.id)}
                      className="p-1.5 hover:bg-accent rounded-sm text-sm text-green-600"
                      title="Restore"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleArchiveChapter(chapter.id)}
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
                            <button
                              onClick={() => handleRestoreTopic(chapter.id, topic.id)}
                              className="p-1.5 hover:bg-accent rounded-sm text-sm text-green-600"
                              title="Restore"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleArchiveTopic(chapter.id, topic.id)}
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

      if (!res.success) toast.error(res.error);
      else {
        toast.success(chapter ? "Chapter updated" : "Chapter created");
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

      if (!res.success) toast.error(res.error);
      else {
        toast.success(topic ? "Topic updated" : "Topic created");
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
