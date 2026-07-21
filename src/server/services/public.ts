import { db } from "../../lib/db";
import { getSiteSettings } from "./site-settings";
import { listPublicAnnouncements } from "./announcements";
import { listPublicResources } from "./study-materials";
import {
  PublicFeePlanSummary,
  publicFeePlanWhere,
  toPublicFeePlanSummary,
} from "./public-fees";

export interface PublicHomeData {
  siteSettings: Awaited<ReturnType<typeof getSiteSettings>> extends {
    success: true;
    data: infer T;
  }
    ? T | null
    : null;
  teachers: Array<{
    id: string;
    fullName: string;
    qualifications: string | null;
    photoFileId: string | null;
    bio: string | null;
    subjects: string[];
  }>;
  batches: Array<{
    id: string;
    name: string;
    curriculumTrack: {
      id: string;
      displayName: string;
      classLevel: string;
      subject: { name: string };
    };
    feePlans: PublicFeePlanSummary[];
  }>;
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    audience: string;
    priority: string;
    publishedAt: Date;
  }>;
  resources: Array<{
    id: string;
    title: string;
    description: string | null;
    resourceType: string;
    visibility: string;
    publishedAt: Date | null;
    externalLinkUrl: string | null;
    fileAssetId: string | null;
    fileName: string | null;
  }>;
}

export async function getPublicHomeData(): Promise<PublicHomeData> {
  const [settingsResult, batches, announcementsResult, teachers, resourcesResult] =
    await Promise.all([
      getSiteSettings(),
      getPublicBatches(),
      listPublicAnnouncements(),
      getPublicTeachers(),
      listPublicResources(1, 6),
    ]);

  return {
    siteSettings: settingsResult.success
      ? (settingsResult.data as unknown as PublicHomeData["siteSettings"])
      : null,
    teachers,
    batches,
    announcements: announcementsResult.success
      ? announcementsResult.data.items
          .filter(
            (
              a,
            ): a is (typeof announcementsResult.data.items)[0] & { publishedAt: Date } =>
              a.publishedAt !== null,
          )
          .slice(0, 3)
      : [],
    resources: resourcesResult.success ? resourcesResult.data : [],
  };
}

async function getPublicBatches() {
  const activeSession = await db.academicSession.findFirst({
    where: { isActive: true },
    select: { id: true },
  });

  if (!activeSession) return [];

  const settings = await db.siteSettings.findFirst();
  const feeDisplayEnabled = settings?.feeDisplayEnabled ?? true;

  if (!feeDisplayEnabled) return [];

  const feePlans = await db.feePlan.findMany({
    where: {
      ...publicFeePlanWhere,
      batch: {
        academicSessionId: activeSession.id,
        archivedAt: null,
        isActive: true,
        showFeePublicly: true,
      },
    },
    include: {
      instalments: {
        where: { isActive: true },
        select: { id: true, label: true, amount: true },
        orderBy: { displayOrder: "asc" },
      },
      batch: {
        include: {
          curriculumTrack: {
            include: { subject: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { batch: { name: "asc" } },
  });

  // Group by batch
  const batchMap = new Map<string, (typeof feePlans)[0][]>();
  for (const fp of feePlans) {
    if (!fp.batch) continue;
    const existing = batchMap.get(fp.batch.id) || [];
    existing.push(fp);
    batchMap.set(fp.batch.id, existing);
  }

  return Array.from(batchMap.entries()).map(([, fps]) => {
    const batch = fps[0].batch!;
    return {
      id: batch.id,
      name: batch.name,
      curriculumTrack: {
        id: batch.curriculumTrack.id,
        displayName: batch.curriculumTrack.displayName,
        classLevel: batch.curriculumTrack.classLevel,
        subject: { name: batch.curriculumTrack.subject.name },
      },
      feePlans: fps.map(toPublicFeePlanSummary),
    };
  });
}

export async function getPublicTeachers() {
  const teachers = await db.teacher.findMany({
    where: { active: true },
    select: {
      id: true,
      displayName: true,
      qualifications: true,
      photoFileId: true,
      bio: true,
      subjects: true,
    },
    orderBy: { displayName: "asc" },
  });

  return teachers.map(teacher => ({
    id: teacher.id,
    fullName: teacher.displayName,
    qualifications: teacher.qualifications,
    photoFileId: teacher.photoFileId,
    bio: teacher.bio,
    subjects: teacher.subjects,
  }));
}
