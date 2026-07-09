// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StudentMaterialList } from "./StudentMaterialList";
import StudentCoursePage from "@/app/student/course/page";
import { requireRole } from "@/lib/auth/permissions";
import { listStudentMaterials } from "@/server/services/study-materials";
import { db } from "@/lib/db";

vi.mock("@/lib/auth/permissions", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/server/services/study-materials", () => ({
  listStudentMaterials: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    chapter: { findMany: vi.fn().mockResolvedValue([]) },
    topic: { findMany: vi.fn().mockResolvedValue([]) },
    student: { findMany: vi.fn(), findUnique: vi.fn() },
  },
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path) => {
    throw new Error(`REDIRECT: ${path}`);
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Student Materials UI", () => {
  it("renders the authorized materials returned by the server boundary", () => {
    const materials = [
      {
        id: "mat-1",
        title: "Calculus Intro",
        description: "Notes",
        resourceType: "DOCUMENT",
        fileAssetId: "file-123",
        lifecycleState: "PUBLISHED",
        publishedAt: new Date("2025-01-01"),
      },
    ];

    render(<StudentMaterialList materials={materials} chapters={[]} topics={[]} />);
    expect(screen.getByText("Calculus Intro")).toBeInTheDocument();
    expect(screen.getByText("Notes")).toBeInTheDocument();
  });

  it("uses /api/materials/[id]/download for file-backed materials", () => {
    const materials = [
      {
        id: "mat-1",
        title: "Calculus Intro",
        resourceType: "DOCUMENT",
        fileAssetId: "file-123",
      },
    ];

    render(<StudentMaterialList materials={materials} chapters={[]} topics={[]} />);
    const link = screen.getByRole("link", { name: /Download/i });
    expect(link).toHaveAttribute("href", "/api/materials/mat-1/download");
    // Raw FileAsset.id is never used for download
    expect(link).not.toHaveAttribute("href", expect.stringContaining("file-123"));
  });

  it("renders external HTTPS URLs correctly for LINK type", () => {
    const materials = [
      {
        id: "mat-2",
        title: "Video Lecture",
        resourceType: "LINK",
        externalLinkUrl: "https://example.com/video",
      },
    ];

    render(<StudentMaterialList materials={materials} chapters={[]} topics={[]} />);
    const link = screen.getByRole("link", { name: /Open/i });
    expect(link).toHaveAttribute("href", "https://example.com/video");
  });

  it("renders text content safely without overflow for TEXT type", () => {
    const materials = [
      {
        id: "mat-3",
        title: "Important Notice",
        resourceType: "TEXT",
        textContent: "Please read Chapter 1 before tomorrow.",
      },
    ];

    render(<StudentMaterialList materials={materials} chapters={[]} topics={[]} />);
    const readBadge = screen.getByText("Read");
    expect(readBadge).toBeInTheDocument();
    expect(screen.getByText("Please read Chapter 1 before tomorrow.")).toHaveClass(
      "whitespace-pre-wrap break-words",
    );
  });

  it("does not expose any mutation controls or submit identity claims", () => {
    const materials = [
      {
        id: "mat-4",
        title: "Student View",
        resourceType: "DOCUMENT",
        fileAssetId: "file-123",
      },
    ];

    render(<StudentMaterialList materials={materials} chapters={[]} topics={[]} />);

    // No edit, publish, or archive buttons should be present
    expect(screen.queryByRole("button", { name: /Edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Publish/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Archive/i })).not.toBeInTheDocument();

    // No forms should exist
    expect(document.querySelector("form")).toBeNull();
  });
});

describe("StudentCoursePage Server Component", () => {
  it("renders empty state when there are active enrolments but no materials", async () => {
    (requireRole as any).mockResolvedValue({
      id: "user-1",
      role: "STUDENT",
      studentId: "stu-1",
    });
    (listStudentMaterials as any).mockResolvedValue({ success: true, data: [] });
    (db.student.findUnique as any).mockResolvedValue({
      id: "stu-1",
      enrolments: [{ status: "ACTIVE" }],
    });

    const jsx = await StudentCoursePage();
    render(jsx);

    expect(screen.getByText("No Materials Yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "There are currently no study materials published for your courses.",
      ),
    ).toBeInTheDocument();
  });

  it("renders zero active enrolments state", async () => {
    (requireRole as any).mockResolvedValue({
      id: "user-1",
      role: "STUDENT",
      studentId: "stu-1",
    });
    (listStudentMaterials as any).mockResolvedValue({ success: true, data: [] });
    (db.student.findUnique as any).mockResolvedValue({
      id: "stu-1",
      enrolments: [],
    });

    const jsx = await StudentCoursePage();
    render(jsx);

    expect(screen.getByText("No Active Courses")).toBeInTheDocument();
    expect(
      screen.getByText("You are not currently enrolled in any active courses."),
    ).toBeInTheDocument();
  });
});
