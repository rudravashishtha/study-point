// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StudentAnnouncementList } from "./StudentAnnouncementList";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});

function makeAnnouncement(overrides: Record<string, unknown> = {}) {
  return {
    id: "a-1",
    title: "Test Notice",
    content: "This is a test notice.",
    audience: "PUBLIC",
    priority: "NORMAL",
    publishedAt: new Date("2026-06-15T10:00:00.000Z"),
    expiresAt: null,
    archivedAt: null,
    createdAt: new Date("2026-06-14T10:00:00.000Z"),
    academicSession: null,
    curriculumTrack: null,
    batch: null,
    ...overrides,
  };
}

describe("StudentAnnouncementList", () => {
  it("1. returns null for empty announcement list", () => {
    const { container } = render(<StudentAnnouncementList announcements={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("2. renders a PUBLIC announcement", () => {
    render(<StudentAnnouncementList announcements={[makeAnnouncement()]} />);
    expect(screen.getByText("Test Notice")).toBeInTheDocument();
    expect(screen.getByText("This is a test notice.")).toBeInTheDocument();
  });

  it("3. renders an ALL_STUDENTS announcement", () => {
    render(
      <StudentAnnouncementList
        announcements={[makeAnnouncement({ audience: "ALL_STUDENTS" })]}
      />,
    );
    expect(screen.getByText("Test Notice")).toBeInTheDocument();
  });

  it("4. renders a CURRICULUM_TRACK announcement", () => {
    render(
      <StudentAnnouncementList
        announcements={[
          makeAnnouncement({
            audience: "CURRICULUM_TRACK",
            curriculumTrack: { id: "t-1", displayName: "Track A" },
          }),
        ]}
      />,
    );
    expect(screen.getByText("Test Notice")).toBeInTheDocument();
  });

  it("5. renders a BATCH announcement", () => {
    render(
      <StudentAnnouncementList
        announcements={[
          makeAnnouncement({
            audience: "BATCH",
            batch: { id: "b-1", name: "Batch A" },
          }),
        ]}
      />,
    );
    expect(screen.getByText("Test Notice")).toBeInTheDocument();
  });

  it("6. draft announcement (publishedAt=null) is filtered out", () => {
    const { container } = render(
      <StudentAnnouncementList
        announcements={[makeAnnouncement({ publishedAt: null })]}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("7. archived announcement is filtered out", () => {
    const { container } = render(
      <StudentAnnouncementList
        announcements={[
          makeAnnouncement({ archivedAt: new Date("2026-06-16T10:00:00.000Z") }),
        ]}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("8. expired announcement is filtered out", () => {
    const { container } = render(
      <StudentAnnouncementList
        announcements={[
          makeAnnouncement({ expiresAt: new Date("2020-01-01T00:00:00.000Z") }),
        ]}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("9. priority badge renders with correct label", () => {
    render(
      <StudentAnnouncementList
        announcements={[makeAnnouncement({ priority: "URGENT" })]}
      />,
    );
    expect(screen.getByText("Urgent")).toBeInTheDocument();
  });

  it("10. published date renders", () => {
    render(<StudentAnnouncementList announcements={[makeAnnouncement()]} />);
    expect(screen.getByText(/Published/)).toBeInTheDocument();
    expect(screen.getByText(/15 Jun 2026/)).toBeInTheDocument();
  });

  it("11. expiry date renders when present", () => {
    render(
      <StudentAnnouncementList
        announcements={[
          makeAnnouncement({ expiresAt: new Date("2026-07-20T00:00:00.000Z") }),
        ]}
      />,
    );
    expect(screen.getByText(/Expires/)).toBeInTheDocument();
    expect(screen.getByText(/20 Jul 2026/)).toBeInTheDocument();
  });

  it("12. no admin controls present", () => {
    render(<StudentAnnouncementList announcements={[makeAnnouncement()]} />);
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Archive")).not.toBeInTheDocument();
    expect(screen.queryByText("Publish")).not.toBeInTheDocument();
    expect(screen.queryByText("Restore")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText(/Create Notice/i)).not.toBeInTheDocument();
  });
});
