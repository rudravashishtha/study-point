import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/db", () => ({
  db: {
    academicSession: { findFirst: vi.fn() },
    siteSettings: { findFirst: vi.fn() },
    curriculumTrack: { findMany: vi.fn() },
    feePlan: { findMany: vi.fn() },
    batch: { findMany: vi.fn() },
  },
}));

import { db } from "../../lib/db";
import { getPublicCourses } from "./public-courses";
import { publicFeePlanWhere } from "./public-fees";

const decimal = (value: number) => ({ toNumber: () => value });

const track = {
  id: "track-1",
  displayName: "Class X Mathematics",
  classLevel: "X",
  boardId: "board-1",
  programmeId: null,
  subjectId: "subject-1",
  board: { id: "board-1", code: "CBSE", name: "CBSE" },
  programme: null,
  subject: { id: "subject-1", name: "Mathematics" },
};

const batch = {
  id: "batch-1",
  name: "Morning Batch",
  isActive: true,
  curriculumTrackId: "track-1",
};

describe("public courses fee visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.academicSession.findFirst).mockResolvedValue({
      id: "session-1",
    } as never);
    vi.mocked(db.siteSettings.findFirst).mockResolvedValue({
      feeDisplayEnabled: true,
    } as never);
    vi.mocked(db.curriculumTrack.findMany).mockResolvedValue([track] as never);
    vi.mocked(db.batch.findMany).mockResolvedValue([batch] as never);
  });

  it("shows public active unarchived FeePlans with no student assignments", async () => {
    vi.mocked(db.feePlan.findMany).mockResolvedValue([
      {
        id: "fee-plan-1",
        name: "Class X Annual Fee",
        showPublicly: true,
        totalAmount: decimal(24000),
        frequency: "YEARLY",
        batchId: "batch-1",
        curriculumTrackId: "track-1",
        instalments: [],
      },
      {
        id: "fee-plan-2",
        name: "Class X Installments",
        showPublicly: true,
        totalAmount: decimal(14000),
        frequency: "CUSTOM",
        batchId: "batch-1",
        curriculumTrackId: "track-1",
        instalments: [],
      },
      {
        id: "fee-plan-3",
        name: "Class X Monthly",
        showPublicly: true,
        totalAmount: decimal(16800),
        frequency: "MONTHLY",
        batchId: "batch-1",
        curriculumTrackId: "track-1",
        instalments: [],
      },
    ] as never);

    const result = await getPublicCourses();

    expect(result.groups[0]?.tracks[0]?.batches[0]?.feePlans).toEqual([
      {
        id: "fee-plan-1",
        name: "Class X Annual Fee",
        showPublicly: true,
        frequency: "YEARLY",
        totalAmount: 24000,
        instalments: [],
      },
      {
        id: "fee-plan-2",
        name: "Class X Installments",
        showPublicly: true,
        frequency: "CUSTOM",
        totalAmount: 14000,
        instalments: [],
      },
      {
        id: "fee-plan-3",
        name: "Class X Monthly",
        showPublicly: true,
        frequency: "MONTHLY",
        totalAmount: 16800,
        instalments: [],
      },
    ]);

    const feePlanQuery = vi.mocked(db.feePlan.findMany).mock.calls[0]?.[0];
    expect(feePlanQuery).toMatchObject({
      where: {
        ...publicFeePlanWhere,
        academicSessionId: "session-1",
        curriculumTrackId: { in: ["track-1"] },
      },
    });
    expect(JSON.stringify(feePlanQuery)).not.toContain("feeAssignments");
  });

  it("uses only FeePlan public visibility fields to hide non-public, archived, or inactive plans", async () => {
    vi.mocked(db.feePlan.findMany).mockResolvedValue([] as never);

    await getPublicCourses();

    expect(vi.mocked(db.feePlan.findMany).mock.calls[0]?.[0]).toMatchObject({
      where: {
        showPublicly: true,
        isActive: true,
        archivedAt: null,
      },
    });
  });

  it("hides fee data gracefully when no public FeePlan exists", async () => {
    vi.mocked(db.feePlan.findMany).mockResolvedValue([] as never);

    const result = await getPublicCourses();

    expect(result.groups[0]?.tracks[0]?.batches[0]?.feePlans).toEqual([]);
  });

  it("falls back from batch-specific to course-level public fee plans", async () => {
    vi.mocked(db.feePlan.findMany).mockResolvedValue([
      {
        id: "fee-plan-track",
        name: "Class X Course Fee",
        showPublicly: true,
        totalAmount: decimal(18000),
        frequency: "YEARLY",
        batchId: null,
        curriculumTrackId: "track-1",
        instalments: [],
      },
    ] as never);

    const result = await getPublicCourses();

    expect(result.groups[0]?.tracks[0]?.batches[0]?.feePlans).toEqual([
      expect.objectContaining({
        id: "fee-plan-track",
        totalAmount: 18000,
      }),
    ]);
  });
});
