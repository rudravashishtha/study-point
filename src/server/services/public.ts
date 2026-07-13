import { db } from "../../lib/db";
import { getSiteSettings } from "./site-settings";
import { listPublicAnnouncements } from "./announcements";
import { listPublicResources } from "./study-materials";

export interface PublicHomeData {
  siteSettings: Awaited<ReturnType<typeof getSiteSettings>> extends {
    success: true;
    data: infer T;
  }
    ? T | null
    : null;
  teacher: {
    id: string;
    fullName: string;
    qualifications: string | null;
    photoFileId: string | null;
    bio: string | null;
    subjects: string[];
  } | null;
  batches: Array<{
    id: string;
    name: string;
    curriculumTrack: {
      id: string;
      displayName: string;
      classLevel: string;
      subject: { name: string };
    };
    feePlan: {
      id: string;
      name: string;
      showPublicly: boolean;
      assignedTotalAmount: number | null;
    } | null;
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
  const [settingsResult, batches, announcementsResult, teacher, resourcesResult] =
    await Promise.all([
      getSiteSettings(),
      getPublicBatches(),
      listPublicAnnouncements(),
      getPublicTeacherProfile(),
      listPublicResources(1, 6),
    ]);

  return {
    siteSettings: settingsResult.success
      ? (settingsResult.data as unknown as PublicHomeData["siteSettings"])
      : null,
    teacher,
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

  const feePlans = await db.feePlan.findMany({
    where: {
      batch: {
        academicSessionId: activeSession.id,
        archivedAt: null,
        isActive: true,
      },
      showPublicly: true,
      feeAssignments: {
        some: {
          status: "ACTIVE",
          archivedAt: null,
        },
      },
    },
    include: {
      batch: {
        include: {
          curriculumTrack: {
            include: { subject: { select: { name: true } } },
          },
        },
      },
      feeAssignments: {
        where: { status: "ACTIVE", archivedAt: null },
        orderBy: { createdAt: "asc" },
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
    const fp = fps[0];
    return {
      id: batch.id,
      name: batch.name,
      curriculumTrack: {
        id: batch.curriculumTrack.id,
        displayName: batch.curriculumTrack.displayName,
        classLevel: batch.curriculumTrack.classLevel,
        subject: { name: batch.curriculumTrack.subject.name },
      },
      feePlan: fp.feeAssignments[0]
        ? {
            id: fp.id,
            name: fp.name,
            showPublicly: fp.showPublicly,
            assignedTotalAmount: Number(fp.feeAssignments[0].assignedTotalAmount),
          }
        : null,
    };
  });
}

export async function getPublicTeacherProfile() {
  const teacher = await db.teacher.findFirst({
    where: { active: true },
    select: {
      id: true,
      displayName: true,
      qualifications: true,
      photoFileId: true,
      bio: true,
    },
  });

  if (!teacher) return null;

  return {
    id: teacher.id,
    fullName: teacher.displayName,
    qualifications: teacher.qualifications,
    photoFileId: teacher.photoFileId,
    bio: teacher.bio,
    subjects: [],
  };
}
