import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { DataListArchiveFilter } from "@/components/admin/data-list/DataListArchiveFilter";
import { LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { ChapterTopicBuilder } from "@/features/curriculum/components/tracks/builder/ChapterTopicBuilder";

export default async function AdminCurriculumBuilderPage({
  params,
  searchParams,
}: {
  params: { trackId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  await requireAdmin();
  const { trackId } = params;
  const resolvedParams = await searchParams;
  const archiveState = (resolvedParams.archiveState as string) || "active";

  const track = await db.curriculumTrack.findUnique({
    where: { id: trackId },
    include: {
      board: true,
      programme: true,
      subject: true,
    },
  });

  if (!track) {
    notFound();
  }

  // Define the archive filter logic precisely as instructed
  let chapters;
  if (archiveState === "active") {
    chapters = await db.chapter.findMany({
      where: { curriculumTrackId: trackId, archivedAt: null },
      orderBy: { displayOrder: "asc" },
      include: {
        topics: {
          where: { archivedAt: null },
          orderBy: { displayOrder: "asc" },
        },
      },
    });
  } else if (archiveState === "archived") {
    chapters = await db.chapter.findMany({
      where: {
        curriculumTrackId: trackId,
        OR: [
          { archivedAt: { not: null } },
          { topics: { some: { archivedAt: { not: null } } } },
        ],
      },
      orderBy: { displayOrder: "asc" },
      include: {
        topics: {
          where: { archivedAt: { not: null } },
          orderBy: { displayOrder: "asc" },
        },
      },
    });
  } else {
    // all
    chapters = await db.chapter.findMany({
      where: { curriculumTrackId: trackId },
      orderBy: { displayOrder: "asc" },
      include: {
        topics: {
          orderBy: { displayOrder: "asc" },
        },
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b">
        <LayoutTemplate className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Builder: {track.displayName}
          </h1>
          <p className="text-muted-foreground">
            {track.board.code} {track.programme ? `· ${track.programme.code}` : ""} ·
            Class {track.classLevel} · {track.subject.name}
          </p>
        </div>
        <div className="ml-auto">
          <Link
            href="/admin/curriculum/curriculum-tracks"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            &larr; Back to Tracks
          </Link>
        </div>
      </div>

      <div className="flex justify-end">
        <DataListArchiveFilter />
      </div>

      <ChapterTopicBuilder
        trackId={trackId}
        initialChapters={chapters}
        archiveState={archiveState}
      />
    </div>
  );
}
