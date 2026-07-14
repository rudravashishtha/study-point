import { ActorContext } from "../../lib/domain/actor";
import { db } from "../../lib/db";
import { ServiceResult, success } from "./types";
import { getStudentTimetable, type TimetableDayGroup } from "./timetable";
import { listStudentAnnouncements } from "./announcements";
import { listStudentHomework } from "./homework";
import { listStudentTests } from "./tests";
import { listStudentFeeDues } from "./fee-assignments";
import { listStudentMaterials } from "./study-materials";
import { getStudentCourseData } from "./student-course";

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

export interface DashboardCourseInfo {
  classLevel: string;
  subjectName: string;
  batchName: string | null;
  academicSession: string;
}

export interface DashboardMaterialItem {
  id: string;
  title: string;
  resourceType: string;
  publishedAt: string | Date | null;
}

export interface StudentDashboardData {
  timetable: { groups: TimetableDayGroup[] };
  announcements: { items: DashboardAnnouncementItem[] };
  homework: { items: DashboardHomeworkItem[] };
  tests: { items: DashboardTestItem[] };
  fees: { assignments: DashboardFeeAssignment[] };
  courses: DashboardCourseInfo[];
  recentMaterials: DashboardMaterialItem[];
}

export async function getStudentDashboard(
  actor: ActorContext,
): Promise<ServiceResult<StudentDashboardData>> {
  const appUser = await db.appUser.findUnique({
    where: { id: actor.userId },
    select: { studentId: true },
  });
  const studentId = appUser?.studentId;

  const [timetable, announcements, homework, tests, fees, materialsResult, courseResult] =
    await Promise.all([
      getStudentTimetable(actor),
      listStudentAnnouncements(actor),
      listStudentHomework(actor.userId, { pageSize: 5 }),
      listStudentTests(actor.userId, { pageSize: 5 }),
      listStudentFeeDues(actor),
      studentId
        ? listStudentMaterials(actor.userId, { pageSize: 5 })
        : Promise.resolve({
            success: true,
            data: { items: [], total: 0, page: 1, pageSize: 5, totalPages: 1 },
          }),
      studentId
        ? getStudentCourseData(studentId)
        : Promise.resolve({ success: true, data: [] }),
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

  const materialsData: DashboardMaterialItem[] = materialsResult.success
    ? materialsResult.data.items.map((m) => ({
        id: m.id,
        title: m.title,
        resourceType: m.resourceType,
        publishedAt: m.publishedAt ? m.publishedAt.toISOString() : null,
      }))
    : [];

  const courseData: DashboardCourseInfo[] = courseResult.success ? courseResult.data : [];

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
    courses: courseData,
    recentMaterials: materialsData,
  });
}
