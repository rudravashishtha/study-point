// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StudentMaterialList } from "./StudentMaterialList";
import type { StudentMaterialListItem } from "@/server/services/study-materials";

function makeItem(overrides: Partial<StudentMaterialListItem>): StudentMaterialListItem {
  return {
    id: "mat-1",
    title: "Calculus Intro",
    description: null,
    resourceType: "DOCUMENT",
    textContent: null,
    fileAssetId: null,
    externalLinkUrl: null,
    visibility: "CURRICULUM_TRACK",
    publishedAt: null,
    classLevel: "X",
    subjectName: "Mathematics",
    chapterName: null,
    topicName: null,
    ...overrides,
  };
}

describe("StudentMaterialList", () => {
  it("renders the authorized materials returned by the server boundary", () => {
    render(
      <StudentMaterialList
        items={[
          makeItem({ title: "Calculus Intro", description: "Notes" }),
          makeItem({ id: "mat-2", title: "Algebra Basics", description: "More notes" }),
        ]}
      />,
    );
    expect(screen.getByText("Calculus Intro")).toBeInTheDocument();
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("Algebra Basics")).toBeInTheDocument();
  });

  it("uses /api/materials/[id]/download for file-backed materials", () => {
    render(
      <StudentMaterialList
        items={[makeItem({ resourceType: "DOCUMENT", fileAssetId: "file-123" })]}
      />,
    );
    const link = screen.getByRole("link", { name: /Download/i });
    expect(link).toHaveAttribute("href", "/api/materials/mat-1/download");
    // Raw FileAsset.id is never used for download
    expect(link).not.toHaveAttribute("href", expect.stringContaining("file-123"));
  });

  it("renders external HTTPS URLs correctly for LINK type", () => {
    render(
      <StudentMaterialList
        items={[
          makeItem({
            resourceType: "LINK",
            externalLinkUrl: "https://example.com/video",
          }),
        ]}
      />,
    );
    const link = screen.getByRole("link", { name: /Open/i });
    expect(link).toHaveAttribute("href", "https://example.com/video");
  });

  it("renders text content safely without overflow for TEXT type", () => {
    render(
      <StudentMaterialList
        items={[
          makeItem({
            resourceType: "TEXT",
            textContent: "Please read Chapter 1 before tomorrow.",
          }),
        ]}
      />,
    );
    const readBadge = screen.getByText("Read");
    expect(readBadge).toBeInTheDocument();
    expect(screen.getByText("Please read Chapter 1 before tomorrow.")).toHaveClass(
      "whitespace-pre-wrap break-words",
    );
  });

  it("does not expose any mutation controls or submit identity claims", () => {
    render(
      <StudentMaterialList
        items={[makeItem({ resourceType: "DOCUMENT", fileAssetId: "file-123" })]}
      />,
    );

    // No edit, publish, or archive buttons should be present
    expect(screen.queryByRole("button", { name: /Edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Publish/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Archive/i })).not.toBeInTheDocument();

    // No forms should exist
    expect(document.querySelector("form")).toBeNull();
  });
});
