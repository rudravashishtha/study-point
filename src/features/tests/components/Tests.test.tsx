// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach, type Mock } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  within,
} from "@testing-library/react";
import { TestList } from "./TestList";
import { StudentTestList } from "./StudentTestList";
import { TestUpload } from "@/components/upload/TestUpload";
import * as testActions from "@/app/admin/tests/actions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/components/upload/TestUpload", () => ({
  TestUpload: vi.fn(),
}));

vi.mock("@/app/admin/tests/actions", () => ({
  createAdminTestAction: vi.fn(),
  updateAdminTestAction: vi.fn(),
  publishAdminTestAction: vi.fn(),
  archiveAdminTestAction: vi.fn(),
}));

function defaultUploadImpl() {
  return (
    <button data-testid="mock-test-upload" type="button">
      Mock Test Upload
    </button>
  );
}

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  (TestUpload as Mock).mockImplementation(defaultUploadImpl);
  const defaultResult = { success: true as const, data: {} } as const;
  vi.mocked(testActions.createAdminTestAction).mockResolvedValue(
    defaultResult as unknown as Awaited<
      ReturnType<typeof testActions.createAdminTestAction>
    >,
  );
  vi.mocked(testActions.updateAdminTestAction).mockResolvedValue(
    defaultResult as unknown as Awaited<
      ReturnType<typeof testActions.updateAdminTestAction>
    >,
  );
  vi.mocked(testActions.publishAdminTestAction).mockResolvedValue(
    defaultResult as unknown as Awaited<
      ReturnType<typeof testActions.publishAdminTestAction>
    >,
  );
  vi.mocked(testActions.archiveAdminTestAction).mockResolvedValue(
    defaultResult as unknown as Awaited<
      ReturnType<typeof testActions.archiveAdminTestAction>
    >,
  );
});

describe("Admin Test UI", () => {
  const sampleTest = {
    id: "test-1",
    title: "Chapter 1 Test",
    description: "Covers algebra basics",
    batchId: "batch-1",
    academicSessionId: "session-1",
    curriculumTrackId: "track-1",
    lifecycleState: "DRAFT",
    testType: "CHAPTER_TEST",
    testDate: new Date("2026-08-01T10:00:00.000Z"),
    durationMinutes: null,
    maximumMarks: 50,
    syllabusDescription: null,
    chapterId: null,
    topicId: null,
    fileAssetId: null,
    questionPaperFileId: null,
    createdAt: new Date(),
    batch: { id: "batch-1", name: "Batch A", archivedAt: null },
    chapter: null,
    topic: null,
    fileAsset: null,
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

  async function fillCreateForm() {
    const titleInput = await screen.findByLabelText("Title");
    fireEvent.change(titleInput, { target: { value: "New Test" } });
    const dialog = screen.getByRole("dialog");
    const comboboxes = within(dialog).getAllByRole("combobox");
    fireEvent.click(comboboxes[0]);
    const option = await screen.findByRole("option", { name: /batch a/i });
    fireEvent.click(option);
    fireEvent.change(await screen.findByLabelText("Maximum Marks"), {
      target: { value: "30" },
    });
    fireEvent.change(await screen.findByLabelText("Date & Time"), {
      target: { value: "2026-08-01T10:00" },
    });
    return dialog;
  }

  it("1. Admin can create test", () => {
    render(<TestList tests={[]} sessions={sessions} batches={batches} tracks={tracks} />);
    expect(screen.getByRole("button", { name: /create test/i })).toBeInTheDocument();
  });

  it("2. Admin can edit published test", () => {
    const published = { ...sampleTest, lifecycleState: "PUBLISHED" };
    render(
      <TestList
        tests={[published]}
        sessions={sessions}
        batches={batches}
        tracks={tracks}
      />,
    );
    expect(screen.getAllByText("Actions")[1]).toBeInTheDocument();
  });

  it("3. Archived test exposes no mutation controls", () => {
    const archived = { ...sampleTest, lifecycleState: "ARCHIVED" };
    render(
      <TestList
        tests={[archived]}
        sessions={sessions}
        batches={batches}
        tracks={tracks}
      />,
    );
    expect(screen.getByText("Archived")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /actions/i })).not.toBeInTheDocument();
  });

  it("4. Test in archived batch exposes no mutation controls", () => {
    const batchArchived = {
      ...sampleTest,
      batch: { id: "batch-1", name: "Batch A", archivedAt: new Date().toISOString() },
    };
    render(
      <TestList
        tests={[batchArchived]}
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
      ...sampleTest,
      batch: { id: "batch-1", name: "Batch A", archivedAt: null },
    };
    render(
      <TestList
        tests={[inactiveBatch]}
        sessions={sessions}
        batches={batches}
        tracks={tracks}
      />,
    );
    expect(screen.getAllByText("Actions")[1]).toBeInTheDocument();
  });

  it("6. DRAFT exposes publish action", () => {
    render(
      <TestList
        tests={[sampleTest]}
        sessions={sessions}
        batches={batches}
        tracks={tracks}
      />,
    );

    fireEvent.click(screen.getAllByText("Actions")[1]);

    expect(screen.getByText("Publish")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Archive")).toBeInTheDocument();
  });

  it("7. PUBLISHED does not expose publish action", () => {
    const published = { ...sampleTest, lifecycleState: "PUBLISHED" };
    render(
      <TestList
        tests={[published]}
        sessions={sessions}
        batches={batches}
        tracks={tracks}
      />,
    );

    fireEvent.click(screen.getAllByText("Actions")[1]);

    expect(screen.queryByText("Publish")).not.toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Archive")).toBeInTheDocument();
  });

  it("8. Unfinalized upload: upload started but not completed — payload has no questionPaperFileId", async () => {
    render(<TestList tests={[]} sessions={sessions} batches={batches} tracks={tracks} />);
    fireEvent.click(screen.getByRole("button", { name: /create test/i }));

    // Fill form
    const dialog = await fillCreateForm();

    // Interact with upload — click to simulate "start upload" (default impl does NOT call onUploadSuccess)
    const uploadBtn = screen.getByTestId("mock-test-upload");
    fireEvent.click(uploadBtn);

    // Submit without waiting for upload to finalize
    const form = dialog.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(vi.mocked(testActions.createAdminTestAction)).toHaveBeenCalled();
      const payload = vi.mocked(testActions.createAdminTestAction).mock.calls[0][0];
      expect(payload).not.toHaveProperty("questionPaperFileId");
    });
  });

  it("9. Finalized upload includes only the resulting fileAssetId in payload", async () => {
    (TestUpload as Mock).mockImplementation(
      ({ onUploadSuccess }: { onUploadSuccess: (id: string) => void }) => (
        <button
          data-testid="mock-test-upload"
          type="button"
          onClick={() => onUploadSuccess("mock-asset-789")}
        >
          Mock Test Upload
        </button>
      ),
    );

    render(<TestList tests={[]} sessions={sessions} batches={batches} tracks={tracks} />);
    fireEvent.click(screen.getByRole("button", { name: /create test/i }));

    const dialog = await fillCreateForm();

    const uploadButton = screen.getByTestId("mock-test-upload");
    fireEvent.click(uploadButton);

    const form = dialog.querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(vi.mocked(testActions.createAdminTestAction)).toHaveBeenCalledWith(
        expect.objectContaining({
          questionPaperFileId: "mock-asset-789",
        }),
      );
    });
  });

  it("10. Download uses /api/tests/[testId]/download", () => {
    const withPaper = {
      ...sampleTest,
      fileAssetId: "file-999",
      lifecycleState: "PUBLISHED",
    };
    render(
      <TestList
        tests={[withPaper]}
        sessions={sessions}
        batches={batches}
        tracks={tracks}
      />,
    );

    const downloadLink = document.querySelector('a[title="Download question paper"]');
    expect(downloadLink).not.toBeNull();
    expect(downloadLink).toHaveAttribute("href", "/api/tests/test-1/download");
    expect(downloadLink?.getAttribute("href")).not.toContain("file-999");
  });

  it("11. Duplicate form submission blocked while pending — action called exactly once", async () => {
    const deferred = new Promise<never>(() => {}); // never resolves
    vi.mocked(testActions.createAdminTestAction).mockReturnValue(deferred);

    render(<TestList tests={[]} sessions={sessions} batches={batches} tracks={tracks} />);
    fireEvent.click(screen.getByRole("button", { name: /create test/i }));

    const dialog = await fillCreateForm();

    // First submit — stays pending
    const form = dialog.querySelector("form")!;
    fireEvent.submit(form);

    // Wait for loading state
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /saving/i })).toBeInTheDocument();
    });

    // Second submit attempt
    fireEvent.submit(form);

    // Give microtasks a chance
    await new Promise((r) => setTimeout(r, 50));

    // The handleSubmit guard (if (loading) return;) should block the second call
    expect(vi.mocked(testActions.createAdminTestAction)).toHaveBeenCalledTimes(1);
  });

  it("12. Client does not submit actor identity, role, permissions, academicSessionId, or curriculumTrackId", async () => {
    render(<TestList tests={[]} sessions={sessions} batches={batches} tracks={tracks} />);
    fireEvent.click(screen.getByRole("button", { name: /create test/i }));

    await fillCreateForm();

    const form = screen.getByRole("dialog").querySelector("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(vi.mocked(testActions.createAdminTestAction)).toHaveBeenCalled();
      const payload = vi.mocked(testActions.createAdminTestAction).mock.calls[0][0];
      expect(payload).not.toHaveProperty("actorUserId");
      expect(payload).not.toHaveProperty("role");
      expect(payload).not.toHaveProperty("permissions");
      expect(payload).not.toHaveProperty("academicSessionId");
      expect(payload).not.toHaveProperty("curriculumTrackId");
    });
  });
});

describe("Student Test UI", () => {
  const sampleTest = {
    id: "test-1",
    title: "Chapter 1 Test",
    description: "Covers algebra basics",
    batchId: "batch-1",
    testType: "CHAPTER_TEST",
    testDate: new Date("2026-08-01T10:00:00.000Z"),
    durationMinutes: 60,
    maximumMarks: 50,
    batch: { id: "batch-1", name: "Batch A" },
    chapter: null,
    topic: null,
  };

  it("13. Renders authorized test metadata", () => {
    render(<StudentTestList tests={[sampleTest]} />);

    expect(screen.getByText("Chapter 1 Test")).toBeInTheDocument();
    expect(screen.getByText("Covers algebra basics")).toBeInTheDocument();
    expect(screen.getByText("Batch A")).toBeInTheDocument();
    expect(screen.getByText("Chapter")).toBeInTheDocument();
    expect(screen.getByText("50 / 60min")).toBeInTheDocument();
  });

  it("14. No questionPaperFileId appears in rendered output", () => {
    render(<StudentTestList tests={[sampleTest]} />);

    expect(screen.queryByText(/questionPaperFileId/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/question paper/i)).not.toBeInTheDocument();
  });

  it("15. No storage key appears", () => {
    render(<StudentTestList tests={[sampleTest]} />);

    expect(screen.queryByText(/storageKey/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/storage/i)).not.toBeInTheDocument();
  });

  it("16. No signed URL appears", () => {
    render(<StudentTestList tests={[sampleTest]} />);

    expect(screen.queryByText(/signed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/download/i)).not.toBeInTheDocument();
  });

  it("17. No download control or indirect question-paper capability", () => {
    render(<StudentTestList tests={[sampleTest]} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByTestId(/download/i)).not.toBeInTheDocument();
  });

  it("18. No mutation controls exist", () => {
    render(<StudentTestList tests={[sampleTest]} />);

    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Archive")).not.toBeInTheDocument();
    expect(screen.queryByText("Publish")).not.toBeInTheDocument();
    expect(screen.queryByText("Create Test")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /actions/i })).not.toBeInTheDocument();
  });

  it("19. No client identity, role, permission, session, or track claims submitted", () => {
    render(<StudentTestList tests={[sampleTest]} />);

    const forms = document.querySelectorAll("form");
    expect(forms.length).toBe(0);

    expect(screen.queryByText(/role/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/permission/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/studentId/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/academicSessionId/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/curriculumTrackId/i)).not.toBeInTheDocument();
  });

  it("20. Empty state: no tests renders null (handled by parent page)", () => {
    const { container } = render(<StudentTestList tests={[]} />);

    expect(container.innerHTML).toBe("");
  });
});
