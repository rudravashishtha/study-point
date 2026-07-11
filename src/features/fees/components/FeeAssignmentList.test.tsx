// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { FeeAssignmentList } from "./FeeAssignmentList";
import { FeeAssignmentStatus } from "@prisma/client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/admin/fee-assignments/actions", () => ({
  previewFeeAssignmentAction: vi.fn().mockResolvedValue({
    success: true,
    data: {
      feePlan: { id: "fp-1", name: "Annual Fee", totalAmount: 12000 },
      startsOn: "2026-07-01",
      endsOn: null,
      items: [
        {
          enrolmentId: "e-1",
          studentName: "Alice",
          studentCode: "STU001",
          valid: true,
          hasExistingActiveAssignment: false,
          proposedDues: [
            {
              label: "Term 1",
              dueDate: "2026-08-01T00:00:00.000Z",
              amountDue: 6000,
              feePlanInstallmentId: "inst-1",
            },
          ],
          totalAmount: 12000,
        },
      ],
      totals: {
        enrolments: 2,
        valid: 1,
        invalid: 0,
        duplicates: 1,
        totalAmount: 12000,
      },
      warnings: [],
    },
  }),
  confirmFeeAssignmentAction: vi.fn().mockResolvedValue({
    success: true,
    data: { created: 1, skipped: 1, failed: 0, items: [] },
  }),
  archiveFeeAssignmentAction: vi.fn().mockResolvedValue({ success: true }),
  restoreFeeAssignmentAction: vi.fn().mockResolvedValue({ success: true }),
}));

afterEach(() => {
  cleanup();
});

function createMockAssignment(
  id: string,
  overrides: Partial<{
    status: FeeAssignmentStatus;
    archivedAt: Date | null;
    studentName: string;
    studentCode: string;
    feePlanName: string;
    amount: number;
    dueCount: number;
    startsOn: Date;
  }> = {},
) {
  const o = {
    status: "ACTIVE" as FeeAssignmentStatus,
    archivedAt: null,
    studentName: "Alice",
    studentCode: "STU001",
    feePlanName: "Annual Fee",
    amount: 12000,
    dueCount: 2,
    startsOn: new Date("2026-07-01"),
    ...overrides,
  };
  return {
    id,
    enrolmentId: `enrol-${id}`,
    feePlanId: `fp-${id}`,
    assignedTotalAmount: o.amount,
    startsOn: o.startsOn,
    endsOn: null,
    status: o.status,
    archivedAt: o.archivedAt,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "admin-1",
    updatedBy: null,
    archivedBy: null,
    enrolment: {
      id: `enrol-${id}`,
      studentId: `stu-${id}`,
      academicSessionId: "session-1",
      curriculumTrackId: "track-1",
      batchId: null,
      joiningDate: new Date(),
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      updatedBy: null,
      archivedAt: null,
      archivedBy: null,
      student: {
        id: `stu-${id}`,
        fullName: o.studentName,
        studentCode: o.studentCode,
        email: null,
        phone: null,
        dateOfBirth: null,
        gender: null,
        address: null,
        city: null,
        state: null,
        pincode: null,
        parentName: null,
        parentPhone: null,
        joiningDate: new Date(),
        status: "active",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
        archivedAt: null,
        archivedBy: null,
      },
    },
    feePlan: { id: `fp-${id}`, name: o.feePlanName },
    _count: { dues: o.dueCount },
  };
}

const sessions = [{ id: "session-1", name: "2026-27" }];
const tracks = [{ id: "track-1", displayName: "CBSE XI" }];
const batches = [
  { id: "batch-1", name: "Batch A", archivedAt: null },
  { id: "batch-2", name: "Batch B", archivedAt: new Date() },
];
const feePlans: any[] = [
  {
    id: "fp-1",
    name: "Annual Fee",
    totalAmount: 12000,
    frequency: "ANNUAL",
    showPublicly: false,
    isActive: true,
    archivedAt: null,
    academicSessionId: "session-1",
    curriculumTrackId: "track-1",
    batchId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
    archivedBy: null,
    description: null,
    academicSession: { id: "session-1", name: "2026-27" },
    curriculumTrack: { id: "track-1", displayName: "CBSE XI" },
    batch: null,
    instalments: [
      {
        id: "inst-1",
        feePlanId: "fp-1",
        label: "Term 1",
        dueOffsetDays: null,
        dueDate: new Date("2026-08-01"),
        amount: 6000,
        displayOrder: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },
];
const enrolments: any[] = [
  {
    id: "e-1",
    studentId: "stu-1",
    academicSessionId: "session-1",
    curriculumTrackId: "track-1",
    batchId: null,
    joiningDate: new Date(),
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
    archivedAt: null,
    archivedBy: null,
    student: {
      id: "stu-1",
      fullName: "Alice",
      studentCode: "STU001",
      email: null,
      phone: null,
      dateOfBirth: null,
      gender: null,
      address: null,
      city: null,
      state: null,
      pincode: null,
      parentName: null,
      parentPhone: null,
      joiningDate: new Date(),
      status: "active",
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      updatedBy: null,
      archivedAt: null,
      archivedBy: null,
    },
    batch: null,
    academicSession: { id: "session-1", name: "2026-27" },
    curriculumTrack: { id: "track-1", displayName: "CBSE XI" },
  },
];

describe("FeeAssignmentList UI", () => {
  it("1. shows empty state when no assignments exist", () => {
    render(
      <FeeAssignmentList
        assignments={[]}
        feePlans={feePlans}
        sessions={sessions}
        tracks={tracks}
        batches={batches}
        enrolments={enrolments}
      />,
    );
    expect(screen.getByText(/no fee assignments found/i)).toBeInTheDocument();
  });

  it("2. filters by search query", () => {
    const data = [
      createMockAssignment("a1", {
        studentName: "Alice",
        feePlanName: "Annual",
      }),
      createMockAssignment("a2", {
        studentName: "Bob",
        feePlanName: "Monthly",
      }),
    ];
    render(
      <FeeAssignmentList
        assignments={data as any}
        feePlans={feePlans}
        sessions={sessions}
        tracks={tracks}
        batches={batches}
        enrolments={enrolments}
      />,
    );
    const searchInput = screen.getByPlaceholderText(/search student or fee plan/i);
    fireEvent.change(searchInput, { target: { value: "Bob" } });
    expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Alice").length).toBe(0);
  });

  it("3. renders the overflow table wrapper", () => {
    const data = [createMockAssignment("a1")];
    render(
      <FeeAssignmentList
        assignments={data as any}
        feePlans={feePlans}
        sessions={sessions}
        tracks={tracks}
        batches={batches}
        enrolments={enrolments}
      />,
    );
    const tables = document.querySelectorAll(".hidden.w-full.overflow-auto");
    expect(tables.length).toBeGreaterThan(0);
  });

  it("4. archive button is present for active assignments", () => {
    render(
      <FeeAssignmentList
        assignments={[createMockAssignment("a1") as any]}
        feePlans={feePlans}
        sessions={sessions}
        tracks={tracks}
        batches={batches}
        enrolments={enrolments}
      />,
    );
    const archiveButtons = screen.getAllByText("Archive");
    expect(archiveButtons.length).toBeGreaterThan(0);
  });

  it("5. archived assignment shows Restore instead of Archive", () => {
    render(
      <FeeAssignmentList
        assignments={
          [
            createMockAssignment("a1", {
              archivedAt: new Date(),
              studentName: "Bob",
            }),
          ] as any
        }
        feePlans={feePlans}
        sessions={sessions}
        tracks={tracks}
        batches={batches}
        enrolments={enrolments}
        defaultArchiveFilter="all"
      />,
    );
    expect(screen.getAllByText("Restore").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Archive").length).toBe(0);
  });

  it("6. active assignment does not show Restore", () => {
    render(
      <FeeAssignmentList
        assignments={[createMockAssignment("a1") as any]}
        feePlans={feePlans}
        sessions={sessions}
        tracks={tracks}
        batches={batches}
        enrolments={enrolments}
      />,
    );
    expect(screen.queryAllByText("Restore").length).toBe(0);
    expect(screen.getAllByText("Archive").length).toBeGreaterThan(0);
  });

  it("7. archive filter switches between active/archived/all", () => {
    const data = [
      createMockAssignment("a1"),
      createMockAssignment("a2", {
        archivedAt: new Date(),
        studentName: "Bob",
      }),
    ];
    render(
      <FeeAssignmentList
        assignments={data as any}
        feePlans={feePlans}
        sessions={sessions}
        tracks={tracks}
        batches={batches}
        enrolments={enrolments}
        defaultArchiveFilter="all"
      />,
    );
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);

    const archiveSelect = screen.getAllByRole("combobox");
    const archiveEl = archiveSelect[archiveSelect.length - 1];
    fireEvent.change(archiveEl, { target: { value: "active" } });
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Bob").length).toBe(0);
  });

  it("8. assign button and preview dialog open", () => {
    render(
      <FeeAssignmentList
        assignments={[]}
        feePlans={feePlans}
        sessions={sessions}
        tracks={tracks}
        batches={batches}
        enrolments={enrolments}
      />,
    );
    const btn = screen.getByRole("button", { name: /assign fee plan/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.getByText("Assign Fee Plan to Students")).toBeInTheDocument();
    expect(screen.getByText(/select a fee plan/i)).toBeInTheDocument();
  });

  it("9. 'Assign Fee Plan' button is present", () => {
    render(
      <FeeAssignmentList
        assignments={[]}
        feePlans={feePlans}
        sessions={sessions}
        tracks={tracks}
        batches={batches}
        enrolments={enrolments}
      />,
    );
    expect(screen.getByRole("button", { name: /assign fee plan/i })).toBeInTheDocument();
  });

  it("10. shows assignment counts", () => {
    const data = [
      createMockAssignment("a1"),
      createMockAssignment("a2", { archivedAt: new Date() }),
    ];
    render(
      <FeeAssignmentList
        assignments={data as any}
        feePlans={feePlans}
        sessions={sessions}
        tracks={tracks}
        batches={batches}
        enrolments={enrolments}
      />,
    );
    expect(screen.getByText(/total:/i)).toBeInTheDocument();
    expect(screen.getByText(/active:/i)).toBeInTheDocument();
    expect(screen.getByText(/archived:/i)).toBeInTheDocument();
  });
});
