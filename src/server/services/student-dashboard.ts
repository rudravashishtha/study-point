import { ActorContext } from "../../lib/domain/actor";
import { ServiceResult, success } from "./types";
import { getStudentTimetable } from "./timetable";
import { listStudentAnnouncements } from "./announcements";
import { listStudentHomework } from "./homework";
import { listStudentTests } from "./tests";
import { listStudentFeeDues } from "./fee-assignments";

export interface StudentDashboardData {
  timetable: { groups: { dayOfWeek: number; dayLabel: string; schedules: any[] }[] };
  announcements: { items: any[] };
  homework: { items: any[] };
  tests: { items: any[] };
  fees: { assignments: any[] };
}

export async function getStudentDashboard(
  actor: ActorContext,
): Promise<ServiceResult<StudentDashboardData>> {
  const [timetable, announcements, homework, tests, fees] = await Promise.all([
    getStudentTimetable(actor),
    listStudentAnnouncements(actor),
    listStudentHomework(actor.userId, { pageSize: 5 }),
    listStudentTests(actor.userId, { pageSize: 5 }),
    listStudentFeeDues(actor),
  ]);

  return success({
    timetable: timetable.success ? timetable.data : { groups: [] },
    announcements: announcements.success ? announcements.data : { items: [] },
    homework: homework.success ? { items: homework.data.items } : { items: [] },
    tests: tests.success ? { items: tests.data.items } : { items: [] },
    fees: fees.success ? fees.data : { assignments: [] },
  });
}
