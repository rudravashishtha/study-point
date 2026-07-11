import { Prisma, AnnouncementAudience, AnnouncementPriority } from "@prisma/client";
import { db } from "../../lib/db";
import { ActorContext } from "../../lib/domain/actor";
import { createAuditLog } from "../../lib/domain/audit";
import { DomainError } from "../../lib/domain/errors";
import { ServiceResult, success, failure } from "./types";

// ─── Input / Result Types ────────────────────────────────────────────

export interface CreateAnnouncementInput {
  academicSessionId?: string | null;
  audience: AnnouncementAudience;
  curriculumTrackId?: string | null;
  batchId?: string | null;
  title: string;
  content: string;
  priority?: AnnouncementPriority;
  publish?: boolean;
  expiresAt?: string | null; // ISO date string
}

export interface UpdateAnnouncementInput {
  title?: string;
  content?: string;
  priority?: AnnouncementPriority;
  expiresAt?: string | null;
}

type AdminAnnouncementRow = Prisma.AnnouncementGetPayload<{
  include: {
    academicSession: { select: { id: true; name: true } };
    curriculumTrack: { select: { id: true; displayName: true } };
    batch: { select: { id: true; name: true } };
  };
}>;

export interface ListAdminParams {
  query?: string;
  audience?: AnnouncementAudience;
  archiveState?: "active" | "archived" | "all";
  academicSessionId?: string;
}

export type AnnouncementListResult = {
  items: AdminAnnouncementRow[];
  total: number;
};

// ─── Input Validation Helpers ────────────────────────────────────────

function validateAudienceInvariants(input: {
  audience: AnnouncementAudience;
  curriculumTrackId?: string | null;
  batchId?: string | null;
}): ServiceResult<{ curriculumTrackId: string | null; batchId: string | null }> {
  const { audience, curriculumTrackId, batchId } = input;

  switch (audience) {
    case "PUBLIC":
    case "ALL_STUDENTS":
      if (curriculumTrackId)
        return failure(
          "INVALID_RELATION",
          "curriculumTrackId must be null for PUBLIC/ALL_STUDENTS",
        );
      if (batchId)
        return failure(
          "INVALID_RELATION",
          "batchId must be null for PUBLIC/ALL_STUDENTS",
        );
      return success({ curriculumTrackId: null, batchId: null });

    case "CURRICULUM_TRACK":
      if (!curriculumTrackId)
        return failure(
          "INVALID_RELATION",
          "curriculumTrackId is required for CURRICULUM_TRACK",
        );
      if (batchId)
        return failure("INVALID_RELATION", "batchId must be null for CURRICULUM_TRACK");
      return success({ curriculumTrackId, batchId: null });

    case "BATCH":
      if (curriculumTrackId)
        return failure(
          "INVALID_RELATION",
          "curriculumTrackId must not be supplied for BATCH; server derives from batch",
        );
      if (!batchId) return failure("INVALID_RELATION", "batchId is required for BATCH");
      return success({ curriculumTrackId: null, batchId });

    default:
      return failure("INVALID_RELATION", `Unknown audience: ${audience}`);
  }
}

async function resolveBatchAudience(
  batchId: string,
): Promise<ServiceResult<{ batchId: string; curriculumTrackId: string }>> {
  const batch = await db.batch.findUnique({ where: { id: batchId } });
  if (!batch) return failure("NOT_FOUND", "Batch not found");
  if (batch.archivedAt)
    return failure("ARCHIVE_BLOCKED", "Cannot target an archived batch");
  return success({ batchId, curriculumTrackId: batch.curriculumTrackId });
}

async function resolveCurriculumTrackAudience(
  curriculumTrackId: string,
): Promise<ServiceResult<{ curriculumTrackId: string }>> {
  const track = await db.curriculumTrack.findUnique({ where: { id: curriculumTrackId } });
  if (!track) return failure("NOT_FOUND", "Curriculum track not found");
  if (track.archivedAt)
    return failure("ARCHIVE_BLOCKED", "Cannot target an archived curriculum track");
  return success({ curriculumTrackId });
}

// ─── Date Helpers ────────────────────────────────────────────────────

function parseISODate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime()))
    throw new DomainError("INVALID_RELATION", `Invalid date: ${value}`);
  return d;
}

// ─── CRUD ────────────────────────────────────────────────────────────

export async function createAnnouncement(
  actor: ActorContext,
  input: CreateAnnouncementInput,
): Promise<ServiceResult<AdminAnnouncementRow>> {
  const invariants = validateAudienceInvariants(input);
  if (!invariants.success) return invariants;

  let curriculumTrackId = invariants.data.curriculumTrackId;
  let batchId = invariants.data.batchId;

  if (input.audience === "BATCH") {
    const resolved = await resolveBatchAudience(batchId!);
    if (!resolved.success) return resolved;
    batchId = resolved.data.batchId;
    curriculumTrackId = resolved.data.curriculumTrackId;
  }

  if (input.audience === "CURRICULUM_TRACK") {
    const resolved = await resolveCurriculumTrackAudience(curriculumTrackId!);
    if (!resolved.success) return resolved;
    curriculumTrackId = resolved.data.curriculumTrackId;
  }

  const expiresAt = parseISODate(input.expiresAt);
  const publishNow = input.publish === true;

  const announcement = await db.$transaction(async (tx) => {
    const created = await tx.announcement.create({
      data: {
        academicSessionId: input.academicSessionId || null,
        audience: input.audience,
        curriculumTrackId,
        batchId,
        title: input.title,
        content: input.content,
        priority: input.priority || "NORMAL",
        publishedAt: publishNow ? new Date() : null,
        expiresAt,
        createdBy: actor.userId,
      },
      include: {
        academicSession: { select: { id: true, name: true } },
        curriculumTrack: { select: { id: true, displayName: true } },
        batch: { select: { id: true, name: true } },
      },
    });

    await createAuditLog(tx, actor, {
      action: "ANNOUNCEMENT_CREATE",
      entityType: "Announcement",
      entityId: created.id,
      summary: `Created announcement: ${created.title}`,
      metadata: {
        audience: created.audience,
        priority: created.priority,
        published: publishNow,
      },
    });

    return created;
  });

  return success(announcement);
}

export async function updateAnnouncement(
  actor: ActorContext,
  id: string,
  input: UpdateAnnouncementInput,
): Promise<ServiceResult<AdminAnnouncementRow>> {
  const existing = await db.announcement.findUnique({ where: { id } });
  if (!existing) return failure("NOT_FOUND", "Announcement not found");
  if (existing.archivedAt)
    return failure("INVALID_LIFECYCLE", "Cannot edit an archived announcement");

  const data: any = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.content !== undefined) data.content = input.content;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.expiresAt !== undefined) data.expiresAt = parseISODate(input.expiresAt);
  data.updatedBy = actor.userId;

  // publishedAt must never be modified by an edit
  delete (data as any).publishedAt;

  const announcement = await db.$transaction(async (tx) => {
    const updated = await tx.announcement.update({
      where: { id },
      data,
      include: {
        academicSession: { select: { id: true, name: true } },
        curriculumTrack: { select: { id: true, displayName: true } },
        batch: { select: { id: true, name: true } },
      },
    });

    await createAuditLog(tx, actor, {
      action: "ANNOUNCEMENT_UPDATE",
      entityType: "Announcement",
      entityId: id,
      summary: `Updated announcement: ${updated.title}`,
      metadata: { updatedFields: Object.keys(data) },
    });

    return updated;
  });

  return success(announcement);
}

export async function publishAnnouncement(
  actor: ActorContext,
  id: string,
): Promise<ServiceResult<AdminAnnouncementRow>> {
  const existing = await db.announcement.findUnique({ where: { id } });
  if (!existing) return failure("NOT_FOUND", "Announcement not found");
  if (existing.archivedAt)
    return failure("INVALID_LIFECYCLE", "Cannot publish an archived announcement");
  if (existing.publishedAt)
    return failure("INVALID_LIFECYCLE", "Announcement is already published");

  const announcement = await db.$transaction(async (tx) => {
    const published = await tx.announcement.update({
      where: { id },
      data: { publishedAt: new Date(), updatedBy: actor.userId },
      include: {
        academicSession: { select: { id: true, name: true } },
        curriculumTrack: { select: { id: true, displayName: true } },
        batch: { select: { id: true, name: true } },
      },
    });

    await createAuditLog(tx, actor, {
      action: "ANNOUNCEMENT_PUBLISH",
      entityType: "Announcement",
      entityId: id,
      summary: `Published announcement: ${published.title}`,
    });

    return published;
  });

  return success(announcement);
}

export async function archiveAnnouncement(
  actor: ActorContext,
  id: string,
): Promise<ServiceResult<AdminAnnouncementRow>> {
  const existing = await db.announcement.findUnique({ where: { id } });
  if (!existing) return failure("NOT_FOUND", "Announcement not found");
  if (existing.archivedAt) {
    const row = await db.announcement.findUnique({
      where: { id },
      include: {
        academicSession: { select: { id: true, name: true } },
        curriculumTrack: { select: { id: true, displayName: true } },
        batch: { select: { id: true, name: true } },
      },
    });
    return success(row!);
  }

  const announcement = await db.$transaction(async (tx) => {
    const archived = await tx.announcement.update({
      where: { id },
      data: { archivedAt: new Date(), archivedBy: actor.userId, updatedBy: actor.userId },
      include: {
        academicSession: { select: { id: true, name: true } },
        curriculumTrack: { select: { id: true, displayName: true } },
        batch: { select: { id: true, name: true } },
      },
    });

    await createAuditLog(tx, actor, {
      action: "ANNOUNCEMENT_ARCHIVE",
      entityType: "Announcement",
      entityId: id,
      summary: `Archived announcement: ${archived.title}`,
    });

    return archived;
  });

  return success(announcement);
}

export async function restoreAnnouncement(
  actor: ActorContext,
  id: string,
): Promise<ServiceResult<AdminAnnouncementRow>> {
  const existing = await db.announcement.findUnique({ where: { id } });
  if (!existing) return failure("NOT_FOUND", "Announcement not found");
  if (!existing.archivedAt) {
    const row = await db.announcement.findUnique({
      where: { id },
      include: {
        academicSession: { select: { id: true, name: true } },
        curriculumTrack: { select: { id: true, displayName: true } },
        batch: { select: { id: true, name: true } },
      },
    });
    return success(row!);
  }

  const announcement = await db.$transaction(async (tx) => {
    const restored = await tx.announcement.update({
      where: { id },
      data: { archivedAt: null, archivedBy: null, updatedBy: actor.userId },
      include: {
        academicSession: { select: { id: true, name: true } },
        curriculumTrack: { select: { id: true, displayName: true } },
        batch: { select: { id: true, name: true } },
      },
    });

    await createAuditLog(tx, actor, {
      action: "ANNOUNCEMENT_RESTORE",
      entityType: "Announcement",
      entityId: id,
      summary: `Restored announcement: ${restored.title}`,
    });

    return restored;
  });

  return success(announcement);
}

// ─── Admin Listing ───────────────────────────────────────────────────

export async function listAdminAnnouncements(
  actor: ActorContext,
  params: ListAdminParams = {},
): Promise<ServiceResult<AnnouncementListResult>> {
  if (actor.role !== "ADMIN") return failure("UNAUTHORIZED", "Admin access required");

  const where: any = {};

  if (params.archiveState === "active") {
    where.archivedAt = null;
  } else if (params.archiveState === "archived") {
    where.archivedAt = { not: null };
  }
  // "all" — no archive filter

  if (params.audience) where.audience = params.audience;
  if (params.academicSessionId) where.academicSessionId = params.academicSessionId;
  if (params.query) {
    where.OR = [
      { title: { contains: params.query, mode: "insensitive" } },
      { content: { contains: params.query, mode: "insensitive" } },
    ];
  }

  const [items, total] = await db.$transaction([
    db.announcement.findMany({
      where,
      orderBy: [
        { priority: "desc" },
        { publishedAt: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      include: {
        academicSession: { select: { id: true, name: true } },
        curriculumTrack: { select: { id: true, displayName: true } },
        batch: { select: { id: true, name: true } },
      },
    }),
    db.announcement.count({ where }),
  ]);

  return success({ items, total });
}

// ─── Student Listing ─────────────────────────────────────────────────

export async function listStudentAnnouncements(
  actor: ActorContext,
): Promise<ServiceResult<{ items: AdminAnnouncementRow[] }>> {
  const appUser = await db.appUser.findUnique({
    where: { id: actor.userId },
    include: {
      student: {
        include: {
          enrolments: {
            where: { status: "active", archivedAt: null },
            select: { curriculumTrackId: true, batchId: true },
          },
        },
      },
    },
  });

  if (!appUser) return failure("UNAUTHORIZED", "User not found");
  if (!appUser.studentId || !appUser.student) {
    return failure("UNAUTHORIZED", "Student profile not found");
  }
  if (appUser.student.enrolments.length === 0) {
    return success({ items: [] });
  }

  const trackIds = appUser.student.enrolments.map((e) => e.curriculumTrackId);
  const batchIds = appUser.student.enrolments
    .map((e) => e.batchId)
    .filter((id): id is string => id !== null);

  const now = new Date();

  const items = await db.announcement.findMany({
    where: {
      publishedAt: { not: null },
      archivedAt: null,
      AND: [
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        {
          OR: [
            { audience: "PUBLIC" },
            { audience: "ALL_STUDENTS" },
            ...(trackIds.length > 0
              ? [
                  {
                    audience: "CURRICULUM_TRACK" as const,
                    curriculumTrackId: { in: trackIds },
                  },
                ]
              : []),
            ...(batchIds.length > 0
              ? [{ audience: "BATCH" as const, batchId: { in: batchIds } }]
              : []),
          ],
        },
      ],
    },
    orderBy: [
      { priority: "desc" },
      { publishedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ],
    include: {
      academicSession: { select: { id: true, name: true } },
      curriculumTrack: { select: { id: true, displayName: true } },
      batch: { select: { id: true, name: true } },
    },
  });

  return success({ items });
}

// ─── Public Listing ──────────────────────────────────────────────────

export async function listPublicAnnouncements(): Promise<
  ServiceResult<{ items: AdminAnnouncementRow[] }>
> {
  const now = new Date();

  const items = await db.announcement.findMany({
    where: {
      audience: "PUBLIC",
      publishedAt: { not: null },
      archivedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: [
      { priority: "desc" },
      { publishedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ],
    include: {
      academicSession: { select: { id: true, name: true } },
      curriculumTrack: { select: { id: true, displayName: true } },
      batch: { select: { id: true, name: true } },
    },
  });

  return success({ items });
}
