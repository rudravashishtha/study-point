import { db } from "../db";
import { ClassLevel } from "@prisma/client";
import { ServiceResult, success, failure } from "@/server/services/types";

export async function resolveBoard(
  boardCode: string,
): Promise<ServiceResult<{ id: string }>> {
  const board = await db.board.findUnique({ where: { code: boardCode } });
  if (!board) {
    return failure("NOT_FOUND", `Board "${boardCode}" not found`);
  }
  return success({ id: board.id });
}

export async function resolveProgramme(
  boardId: string,
  programmeCode: string,
): Promise<ServiceResult<{ id: string } | null>> {
  if (!programmeCode) return success(null);
  const programme = await db.programme.findUnique({
    where: { boardId_code: { boardId, code: programmeCode } },
  });
  if (!programme) {
    return failure("NOT_FOUND", `Programme "${programmeCode}" not found for this board`);
  }
  return success({ id: programme.id });
}

export async function resolveCurriculumTrack(
  boardId: string,
  programmeId: string | null,
  classLevel: ClassLevel,
  subjectCode: string,
): Promise<ServiceResult<{ id: string }>> {
  const subject = await db.subject.findUnique({ where: { code: subjectCode } });
  if (!subject) {
    return failure("NOT_FOUND", `Subject "${subjectCode}" not found`);
  }

  const track = await db.curriculumTrack.findFirst({
    where: {
      boardId,
      programmeId: programmeId ?? null,
      classLevel,
      subjectId: subject.id,
    },
  });
  if (!track) {
    return failure(
      "NOT_FOUND",
      `Curriculum track not found for board/programme/class/subject combination`,
    );
  }
  return success({ id: track.id });
}

export async function resolveChapter(
  curriculumTrackId: string,
  chapterName: string,
): Promise<ServiceResult<{ id: string }>> {
  const chapter = await db.chapter.findFirst({
    where: {
      curriculumTrackId,
      name: { equals: chapterName, mode: "insensitive" },
    },
  });
  if (!chapter) {
    return failure(
      "NOT_FOUND",
      `Chapter "${chapterName}" not found in this curriculum track`,
    );
  }
  return success({ id: chapter.id });
}

export async function resolveTopic(
  chapterId: string,
  topicName: string | null,
): Promise<ServiceResult<{ id: string } | null>> {
  if (!topicName) return success(null);
  const topic = await db.topic.findFirst({
    where: {
      chapterId,
      name: { equals: topicName, mode: "insensitive" },
    },
  });
  if (!topic) {
    return failure("NOT_FOUND", `Topic "${topicName}" not found in this chapter`);
  }
  return success({ id: topic.id });
}
