// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  within,
} from "@testing-library/react";
import { HomeworkList } from "./HomeworkList";
import { TeacherHomeworkList } from "./TeacherHomeworkList";
import { StudentHomeworkList } from "./StudentHomeworkList";
import { HomeworkLifecycleState } from "@prisma/client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/admin/homework/actions", () => ({
  createAdminHomeworkAction: vi.fn().mockResolvedValue({ success: true }),
  updateAdminHomeworkAction: vi.fn().mockResolvedValue({ success: true }),
  publishAdminHomeworkAction: vi.fn().mockResolvedValue({ success: true }),
  archiveAdminHomeworkAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/app/teacher/batches/[batchId]/actions", () => ({
  createTeacherHomeworkAction: vi.fn().mockResolvedValue({ success: true }),
  updateTeacherHomeworkAction: vi.fn().mockResolvedValue({ success: true }),
  publishTeacherHomeworkAction: vi.fn().mockResolvedValue({ success: true }),
  archiveTeacherHomeworkAction: vi.fn().mockResolvedValue({ success: true }),
  createTeacherMaterialAction: vi.fn().mockResolvedValue({ success: true }),
  updateTeacherMaterialAction: vi.fn().mockResolvedValue({ success: true }),
  publishTeacherMaterialAction: vi.fn().mockResolvedValue({ success: true }),
  archiveTeacherMaterialAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/components/upload/HomeworkUpload", () => ({
  HomeworkUpload: ({
    onUploadSuccess,
  }: {
    onUploadSuccess: (assetId: string) => void;
  }) => (
    <button
      data-testid="mock-hw-upload"
      type="button"
      onClick={() => onUploadSuccess("mock-asset-456")}
    >
      Mock Homework Upload
    </button>
  ),
}));

afterEach(() => {
  cleanup();
});

describe("Admin Homework UI", () => {
  const sampleHomework = {
    id: "hw-1",
    title: "Algebra Worksheet",
    description: "Solve linear equations",
    batchId: "batch-1",
    academicSessionId: "session-1",
    curriculumTrackId: "track-1",
    lifecycleState: HomeworkLifecycleState.DRAFT,
    assignedDate: "2026-07-01",
    dueDate: "2026-07-10",
    chapterId: null,
    topicId: null,
    fileAssetId: null,
    createdAt: new Date(),
    batch: { id: "batch-1", name: "Batch A", archivedAt: null },
    chapter: null,
    topic: null,
    fileAsset: null,
    academicSession: null,
    curriculumTrack: null,
  };

  const sessions = [{ id: "session-1", name: "2026-27" }];
  const batches = [
    {
      id: "batch-1",
      name: "Batch A",
      archivedAt: null,
      curriculumTrack: { id: "track-1" },
    },
  ];
  const tracks = [{ id: "track-1", name: "Track 1" }];

  it("1. Admin can create homework", () => {
    render(
      <HomeworkList
        homework={[]}
        sessions={sessions}
        batches={batches}
        tracks={tracks}
      />,
    );
    expect(screen.getByRole("button", { name: /create homework/i })).toBeInTheDocument();
  });

  it("2. Admin can edit published homework", () => {
    const published = {
      ...sampleHomework,
      lifecycleState: HomeworkLifecycleState.PUBLISHED,
    };
    render(
      <HomeworkList
        homework={[published]}
        sessions={sessions}
        batches={batches}
        tracks={tracks}
      />,
    );
    // Actions menu should exist for published homework
    expect(screen.getAllByText("Actions")[1]).toBeInTheDocument();
  });

  it("3. Archived homework shows no mutation controls", () => {
    const archived = {
      ...sampleHomework,
      lifecycleState: HomeworkLifecycleState.ARCHIVED,
    };
    render(
      <HomeworkList
        homework={[archived]}
        sessions={sessions}
        batches={batches}
        tracks={tracks}
      />,
    );
    expect(screen.getByText("Archived")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /actions/i })).not.toBeInTheDocument();
  });

  it("4. Homework in archived batch shows no mutation controls", () => {
    const batchArchived = {
      ...sampleHomework,
      batch: { id: "batch-1", name: "Batch A", archivedAt: new Date().toISOString() },
    };
    render(
      <HomeworkList
        homework={[batchArchived]}
        sessions={sessions}
        batches={batches}
        tracks={tracks}
      />,
    );
    expect(screen.queryByRole("button", { name: /actions/i })).not.toBeInTheDocument();
    expect(screen.getByText("Batch archived")).toBeInTheDocument();
  });

  it("5. Inactive non-archived batch remains manageable", () => {
    const inactiveBatch = {
      ...sampleHomework,
      batch: { id: "batch-1", name: "Batch A", archivedAt: null },
    };
    render(
      <HomeworkList
        homework={[inactiveBatch]}
        sessions={sessions}
        batches={batches}
        tracks={tracks}
      />,
    );
    expect(screen.getAllByText("Actions")[1]).toBeInTheDocument();
  });

  it("6. Published homework does not expose publish action", () => {
    const published = {
      ...sampleHomework,
      lifecycleState: HomeworkLifecycleState.PUBLISHED,
    };
    render(
      <HomeworkList
        homework={[published]}
        sessions={sessions}
        batches={batches}
        tracks={tracks}
      />,
    );

    // Open actions menu
    fireEvent.click(screen.getAllByText("Actions")[1]);

    // Publish should not be present
    expect(screen.queryByText("Publish")).not.toBeInTheDocument();
    // Edit and Archive should be present
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Archive")).toBeInTheDocument();
  });

  it("7. Attachment is optional; form submits without fileAssetId when none uploaded", async () => {
    const { createAdminHomeworkAction } = await import("@/app/admin/homework/actions");

    render(
      <HomeworkList
        homework={[]}
        sessions={sessions}
        batches={batches}
        tracks={tracks}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /create homework/i }));

    // Fill required text/date fields (these use <Input> with proper labels)
    fireEvent.change(await screen.findByLabelText("Title"), {
      target: { value: "Optional Attachment HW" },
    });
    fireEvent.change(await screen.findByLabelText("Assigned Date"), {
      target: { value: "2026-07-01" },
    });
    fireEvent.change(await screen.findByLabelText("Due Date"), {
      target: { value: "2026-07-10" },
    });

    // Select batch by clicking the first combobox (Batch) inside the dialog
    const dialog = screen.getByRole("dialog");
    const comboboxes = within(dialog).getAllByRole("combobox");
    fireEvent.click(comboboxes[0]);

    const option = await screen.findByRole("option", { name: /batch a/i });
    fireEvent.click(option);

    // Submit the form
    const form = dialog.querySelector("form");
    expect(form).not.toBeNull();
    if (form) fireEvent.submit(form);

    await waitFor(() => {
      expect(createAdminHomeworkAction).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Optional Attachment HW",
          assignedDate: "2026-07-01",
          dueDate: "2026-07-10",
        }),
      );
      // Verify fileAssetId is not in the payload
      const payload = (
        createAdminHomeworkAction as unknown as {
          mock: { calls: Array<Array<Record<string, unknown>>> };
        }
      ).mock.calls[0][0];
      expect(payload.fileAssetId).toBeUndefined();
    });
  });
});

describe("Teacher Homework UI", () => {
  const sampleHomework = {
    id: "hw-1",
    title: "Algebra Worksheet",
    description: "Solve linear equations",
    batchId: "batch-1",
    lifecycleState: HomeworkLifecycleState.DRAFT,
    assignedDate: "2026-07-01",
    dueDate: "2026-07-10",
    chapterId: null,
    topicId: null,
    fileAssetId: null,
    createdAt: new Date(),
    chapter: null,
    topic: null,
    fileAsset: null,
  };

  const defaultBatchId = "batch-1";

  it("8. HOMEWORK_VIEW teacher sees homework but no mutation controls", () => {
    render(
      <TeacherHomeworkList
        homework={[sampleHomework]}
        chapters={[]}
        batchId={defaultBatchId}
        canManage={false}
      />,
    );

    expect(screen.getAllByText("Algebra Worksheet")[0]).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create homework/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /actions/i })).not.toBeInTheDocument();
  });

  it("9. HOMEWORK_MANAGE teacher sees create button and actions", () => {
    render(
      <TeacherHomeworkList
        homework={[sampleHomework]}
        chapters={[]}
        batchId={defaultBatchId}
        canManage={true}
      />,
    );

    expect(
      screen.getAllByRole("button", { name: /create homework/i })[0],
    ).toBeInTheDocument();
    expect(screen.getAllByText("Actions")[1]).toBeInTheDocument();
  });

  it("10. Archived batch disables mutations (canManage=false)", () => {
    render(
      <TeacherHomeworkList
        homework={[sampleHomework]}
        chapters={[]}
        batchId={defaultBatchId}
        canManage={false}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /create homework/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /actions/i })).not.toBeInTheDocument();
  });

  it("11. Batch context is fixed (batchId passed as prop, no client selector)", async () => {
    render(
      <TeacherHomeworkList
        homework={[]}
        chapters={[]}
        batchId={defaultBatchId}
        canManage={true}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /create homework/i })[0]);

    // The form has no batch selector; batch is injected server-side
    expect(screen.queryByText("Select batch")).not.toBeInTheDocument();
    expect(screen.queryByText("Batch")).not.toBeInTheDocument();
  });

  it("12. Duplicate submissions prevented while pending (submit button disabled)", async () => {
    await import("@/app/teacher/batches/[batchId]/actions");

    render(
      <TeacherHomeworkList
        homework={[]}
        chapters={[]}
        batchId={defaultBatchId}
        canManage={true}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /create homework/i })[0]);

    fireEvent.change(await screen.findByLabelText("Title"), {
      target: { value: "New Homework" },
    });
    fireEvent.change(await screen.findByLabelText("Assigned Date"), {
      target: { value: "2026-07-01" },
    });
    fireEvent.change(await screen.findByLabelText("Due Date"), {
      target: { value: "2026-07-10" },
    });

    const form = document.querySelector("form");
    if (form) fireEvent.submit(form);

    // After submission, button should show "Saving..." (disabled)
    expect(screen.getByRole("button", { name: /saving/i })).toBeInTheDocument();
  });
});

describe("Student Homework UI", () => {
  const sampleHomework = {
    id: "hw-1",
    title: "Algebra Worksheet",
    description: "Solve linear equations",
    batchId: "batch-1",
    lifecycleState: HomeworkLifecycleState.PUBLISHED,
    assignedDate: "2026-07-01",
    dueDate: "2026-07-15",
    chapterId: null,
    topicId: null,
    fileAssetId: null,
    batch: { id: "batch-1", name: "Batch A" },
    chapter: null,
    topic: null,
    fileAsset: null,
  };

  it("13. Renders authorized published homework", () => {
    render(<StudentHomeworkList homework={[sampleHomework]} />);

    expect(screen.getByText("Algebra Worksheet")).toBeInTheDocument();
    expect(screen.getByText("Batch A")).toBeInTheDocument();
  });

  it("14. Overdue homework is flagged", () => {
    const overdue = {
      ...sampleHomework,
      dueDate: "2020-01-01",
    };
    render(<StudentHomeworkList homework={[overdue]} />);

    expect(screen.getByText(/Overdue/i)).toBeInTheDocument();
  });

  it("15. Download link uses /api/homework/[homeworkId]/download", () => {
    const withFile = {
      ...sampleHomework,
      fileAssetId: "file-999",
    };
    render(<StudentHomeworkList homework={[withFile]} />);

    const downloadLink = document.querySelector('a[title="Download attachment"]');
    expect(downloadLink).not.toBeNull();
    expect(downloadLink).toHaveAttribute("href", "/api/homework/hw-1/download");
    expect(downloadLink?.getAttribute("href")).not.toContain("file-999");
  });

  it("16. No mutation controls exist", () => {
    render(<StudentHomeworkList homework={[sampleHomework]} />);

    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Archive")).not.toBeInTheDocument();
    expect(screen.queryByText("Publish")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /actions/i })).not.toBeInTheDocument();
  });

  it("17. No identity or authorization claims submitted by client", () => {
    render(<StudentHomeworkList homework={[sampleHomework]} />);

    // The component renders no hidden inputs or forms with auth claims
    const forms = document.querySelectorAll("form");
    expect(forms.length).toBe(0);

    // No element contains role, studentId, or permissions text
    expect(screen.queryByText(/role/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/permission/i)).not.toBeInTheDocument();
  });

  it("18. Empty state: no homework renders null (handled by parent page)", () => {
    const { container } = render(<StudentHomeworkList homework={[]} />);

    expect(container.innerHTML).toBe("");
  });
});
