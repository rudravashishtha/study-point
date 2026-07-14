// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { TeacherMaterialList } from "./TeacherMaterialList";
import {
  StudyMaterialLifecycleState,
  StudyMaterialResourceType,
  StudyMaterialVisibility,
} from "@prisma/client";
import { createTeacherMaterialAction } from "@/app/teacher/batches/[batchId]/actions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/teacher/batches/[batchId]/actions", () => ({
  createTeacherMaterialAction: vi.fn().mockResolvedValue({ success: true }),
  updateTeacherMaterialAction: vi.fn().mockResolvedValue({ success: true }),
  publishTeacherMaterialAction: vi.fn().mockResolvedValue({ success: true }),
  archiveTeacherMaterialAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/components/upload/StudyMaterialUpload", () => ({
  StudyMaterialUpload: ({
    onUploadSuccess,
  }: {
    onUploadSuccess: (assetId: string) => void;
  }) => (
    <button
      data-testid="mock-upload"
      type="button"
      onClick={() => onUploadSuccess("mock-asset-123")}
    >
      Mock Upload
    </button>
  ),
}));

afterEach(() => {
  cleanup();
});

describe("Teacher Materials UI", () => {
  const defaultBatchId = "batch-1";

  const sampleMaterial = {
    id: "mat-1",
    title: "Batch Algebra Notes",
    description: "Introductory notes",
    resourceType: StudyMaterialResourceType.DOCUMENT,
    lifecycleState: StudyMaterialLifecycleState.DRAFT,
    visibility: StudyMaterialVisibility.BATCH,
    batchId: defaultBatchId,
    fileAssetId: "file-123",
    createdAt: new Date(),
  };

  it("Teacher with MATERIALS_VIEW can view materials but sees no mutation controls", () => {
    render(
      <TeacherMaterialList
        materials={[sampleMaterial]}
        chapters={[]}
        batchId={defaultBatchId}
        canManage={false} // MATERIALS_VIEW only
      />,
    );

    // View is present
    expect(screen.getAllByText("Batch Algebra Notes")[0]).toBeInTheDocument();

    // No create button
    expect(
      screen.queryByRole("button", { name: /create material/i }),
    ).not.toBeInTheDocument();

    // No action menu for edits
    expect(screen.queryByRole("button", { name: /actions/i })).not.toBeInTheDocument();
  });

  it("Teacher with MATERIALS_MANAGE sees the allowed mutation controls", () => {
    render(
      <TeacherMaterialList
        materials={[sampleMaterial]}
        chapters={[]}
        batchId={defaultBatchId}
        canManage={true}
      />,
    );

    // Create button is present
    expect(
      screen.getAllByRole("button", { name: /create material/i })[0],
    ).toBeInTheDocument();

    // Actions menu is present for the item
    // Index 1 because Index 0 is the table header for "Actions"
    expect(screen.getAllByText("Actions")[1]).toBeInTheDocument();
  });

  it("Teacher UI exposes only BATCH scope fields in the form (does not allow visibility changing)", async () => {
    render(
      <TeacherMaterialList
        materials={[]}
        chapters={[]}
        batchId={defaultBatchId}
        canManage={true}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /create material/i })[0]);

    // Visibility dropdown should NOT be present (the form hardcodes batch visibility in server action)
    // The form lacks the "Visibility Scope" field entirely.
    expect(screen.queryByText("Visibility Scope")).not.toBeInTheDocument();
    expect(screen.queryByText("Specific Batch")).not.toBeInTheDocument();

    // Form is purely content-focused
    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
  });

  it("Archived material exposes no mutation controls even with canManage", () => {
    render(
      <TeacherMaterialList
        materials={[
          { ...sampleMaterial, lifecycleState: StudyMaterialLifecycleState.ARCHIVED },
        ]}
        chapters={[]}
        batchId={defaultBatchId}
        canManage={true}
      />,
    );

    expect(screen.getAllByText("Batch Algebra Notes")[0]).toBeInTheDocument();
    expect(screen.getByText("Archived")).toBeInTheDocument();

    // Cannot edit or archive an already archived material
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("Archived Batch disables all material mutations (handled by passing canManage=false when batch is archived)", () => {
    render(
      <TeacherMaterialList
        materials={[sampleMaterial]}
        chapters={[]}
        batchId={defaultBatchId}
        canManage={false} // Simulated archived batch
      />,
    );

    expect(
      screen.queryByRole("button", { name: /create material/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("Teacher file download uses the material download route and never raw FileAsset.id", () => {
    render(
      <TeacherMaterialList
        materials={[sampleMaterial]}
        chapters={[]}
        batchId={defaultBatchId}
        canManage={false}
      />,
    );

    const downloadLink = document.querySelector('a[title="Download"]');
    expect(downloadLink).not.toBeNull();
    expect(downloadLink).toHaveAttribute("href", "/api/materials/mat-1/download");
    // Ensure the raw file ID is not used in the download path
    expect(downloadLink?.getAttribute("href")).not.toContain("file-123");
  });

  it("No role, permissions, session authorization claim, track authorization claim, or Teacher identity is submitted by the client", async () => {
    render(
      <TeacherMaterialList
        materials={[]}
        chapters={[]}
        batchId={defaultBatchId}
        canManage={true}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /create material/i })[0]);

    fireEvent.change(await screen.findByLabelText("Title"), {
      target: { value: "New Notes" },
    });

    // Mock the upload so validation passes
    fireEvent.click(screen.getByTestId("mock-upload"));

    // Notice we aren't selecting a session, track, role, or identity. We only enter content.
    const form = document.querySelector("form");
    if (form) fireEvent.submit(form);

    await waitFor(() => {
      expect(createTeacherMaterialAction).toHaveBeenCalledWith(defaultBatchId, {
        title: "New Notes",
        description: null,
        resourceType: "DOCUMENT",
        chapterId: null,
        topicId: null,
        fileAssetId: "mock-asset-123",
      });
    });
  });
});
