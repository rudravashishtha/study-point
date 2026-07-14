import { db } from "@/lib/db";
import { ServiceResult } from "./types";

type ScheduleInfo = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  roomOrLocation: string | null;
  liveClassUrl: string | null;
};

type TeacherInfo = {
  name: string;
};

export type EnrolmentCourseInfo = {
  enrolmentId: string;
  classLevel: string;
  subjectName: string;
  batchName: string | null;
  academicSession: string;
  schedules: ScheduleInfo[];
  teachers: TeacherInfo[];
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatSchedule(schedules: ScheduleInfo[]): string {
  if (schedules.length === 0) return "No schedule set";
  return schedules
    .map((s) => `${DAY_LABELS[s.dayOfWeek]} ${s.startTime}-${s.endTime}`)
    .join(", ");
}

export { formatSchedule, DAY_LABELS };

export async function getStudentCourseData(
  studentId: string,
): Promise<ServiceResult<EnrolmentCourseInfo[]>> {
  try {
    const enrolments = await db.enrolment.findMany({
      where: { studentId, status: "active", archivedAt: null },
      select: {
        id: true,
        curriculumTrack: {
          select: {
            classLevel: true,
            subject: { select: { name: true } },
          },
        },
        batch: {
          select: {
            id: true,
            name: true,
            schedules: {
              where: { isActive: true },
              select: {
                dayOfWeek: true,
                startTime: true,
                endTime: true,
                roomOrLocation: true,
                liveClassUrl: true,
              },
              orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
            },
            teacherAssignments: {
              where: { archivedAt: null },
              select: {
                teacher: { select: { displayName: true } },
              },
            },
          },
        },
        academicSession: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (enrolments.length === 0) {
      return { success: true, data: [] };
    }

    const data: EnrolmentCourseInfo[] = enrolments.map((e) => ({
      enrolmentId: e.id,
      classLevel: e.curriculumTrack.classLevel,
      subjectName: e.curriculumTrack.subject.name,
      batchName: e.batch?.name ?? null,
      academicSession: e.academicSession.name,
      schedules: (e.batch?.schedules ?? []).map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        roomOrLocation: s.roomOrLocation,
        liveClassUrl: s.liveClassUrl,
      })),
      teachers: (e.batch?.teacherAssignments ?? []).map((ta) => ({
        name: ta.teacher.displayName,
      })),
    }));

    return { success: true, data };
  } catch {
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to load course information." },
    };
  }
}
