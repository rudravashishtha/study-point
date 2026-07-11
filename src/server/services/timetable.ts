import { Prisma } from "@prisma/client";
import { db } from "../../lib/db";
import { ActorContext } from "../../lib/domain/actor";
import { ServiceResult, success, failure } from "./types";

export type ScheduleWithBatch = Prisma.BatchScheduleGetPayload<{
  include: {
    batch: {
      include: {
        curriculumTrack: { include: { board: true; subject: true } };
      };
    };
  };
}>;

export interface TimetableDayGroup {
  dayOfWeek: number;
  dayLabel: string;
  schedules: ScheduleWithBatch[];
}

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export async function getStudentTimetable(
  actor: ActorContext,
): Promise<ServiceResult<{ groups: TimetableDayGroup[] }>> {
  const appUser = await db.appUser.findUnique({
    where: { id: actor.userId },
    include: {
      student: {
        include: {
          enrolments: {
            where: { status: "active", archivedAt: null },
            select: { batchId: true },
          },
        },
      },
    },
  });

  if (!appUser || appUser.role !== "STUDENT" || !appUser.studentId || !appUser.student) {
    return failure("UNAUTHORIZED", "Valid student required");
  }

  const batchIds = appUser.student.enrolments
    .map((e) => e.batchId)
    .filter((id): id is string => id !== null);

  if (batchIds.length === 0) {
    return success({ groups: [] });
  }

  const schedules = await db.batchSchedule.findMany({
    where: {
      batchId: { in: batchIds },
      isActive: true,
      batch: { archivedAt: null },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    include: {
      batch: {
        include: {
          curriculumTrack: { include: { board: true, subject: true } },
        },
      },
    },
  });

  const grouped: Record<number, ScheduleWithBatch[]> = {};
  for (const s of schedules) {
    if (!grouped[s.dayOfWeek]) grouped[s.dayOfWeek] = [];
    grouped[s.dayOfWeek].push(s);
  }

  const groups: TimetableDayGroup[] = Object.entries(grouped)
    .map(([dayOfWeek, daySchedules]) => ({
      dayOfWeek: Number(dayOfWeek),
      dayLabel: DAY_LABELS[Number(dayOfWeek)] || `Day ${dayOfWeek}`,
      schedules: daySchedules,
    }))
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  return success({ groups });
}
