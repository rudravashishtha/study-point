import { ActorContext } from "../../lib/domain/actor";
import { ServiceResult, success } from "./types";
import { getStudentTimetable, type TimetableDayGroup } from "./timetable";
import { listStudentAnnouncements } from "./announcements";
import { listStudentHomework } from "./homework";
import { listStudentTests } from "./tests";
import { listStudentFeeDues } from "./fee-assignments";

export interface DashboardAnnouncementItem {
  id: string;
  title: string;
  publishedAt: string | Date | null;
}

export interface DashboardHomeworkItem {
  id: string;
  title: string;
  dueDate: string | Date;
}

export interface DashboardTestItem {
  id: string;
  title: string;
  testDate: string | Date;
}

export interface DashboardFeeDue {
  status: string;
  amountDue: string;
  amountWaived: string;
}

export interface DashboardFeeAssignment {
  dues?: DashboardFeeDue[];
}

export interface StudentDashboardData {
  timetable: { groups: TimetableDayGroup[] };
  announcements: { items: DashboardAnnouncementItem[] };
  homework: { items: DashboardHomeworkItem[] };
  tests: { items: DashboardTestItem[] };
  fees: { assignments: DashboardFeeAssignment[] };
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

  const feeAssignments: DashboardFeeAssignment[] = fees.success
    ? fees.data.assignments.map((a) => ({
        dues: a.dues.map((d) => ({
          status: d.status,
          amountDue: d.amountDue.toString(),
          amountWaived: d.amountWaived.toString(),
        })),
      }))
    : [];

  return success({
    timetable: timetable.success ? timetable.data : { groups: [] },
    announcements: announcements.success
      ? { items: announcements.data.items as DashboardAnnouncementItem[] }
      : { items: [] },
    homework: homework.success
      ? { items: homework.data.items as DashboardHomeworkItem[] }
      : { items: [] },
    tests: tests.success
      ? { items: tests.data.items as DashboardTestItem[] }
      : { items: [] },
    fees: { assignments: feeAssignments },
  });
}
