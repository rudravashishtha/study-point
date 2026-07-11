// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PublicAnnouncementList } from "./PublicAnnouncementList";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});

function makeAnnouncement(overrides: Record<string, unknown> = {}) {
  return {
    id: "a-1",
    title: "Public Notice",
    content: "This is a public notice.",
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

describe("PublicAnnouncementList", () => {
  it("1. returns null for empty announcement list", () => {
    const { container } = render(<PublicAnnouncementList announcements={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("2. renders a PUBLIC announcement", () => {
    render(<PublicAnnouncementList announcements={[makeAnnouncement()]} />);
    expect(screen.getByText("Public Notice")).toBeInTheDocument();
    expect(screen.getByText("This is a public notice.")).toBeInTheDocument();
  });

  it("3. ALL_STUDENTS announcement is filtered out", () => {
    const { container } = render(
      <PublicAnnouncementList
        announcements={[makeAnnouncement({ audience: "ALL_STUDENTS" })]}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("4. CURRICULUM_TRACK announcement is filtered out", () => {
    const { container } = render(
      <PublicAnnouncementList
        announcements={[
          makeAnnouncement({
            audience: "CURRICULUM_TRACK",
            curriculumTrack: { id: "t-1", displayName: "Track A" },
          }),
        ]}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("5. BATCH announcement is filtered out", () => {
    const { container } = render(
      <PublicAnnouncementList
        announcements={[
          makeAnnouncement({
            audience: "BATCH",
            batch: { id: "b-1", name: "Batch A" },
          }),
        ]}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("6. draft announcement (publishedAt=null) is filtered out", () => {
    const { container } = render(
      <PublicAnnouncementList
        announcements={[makeAnnouncement({ publishedAt: null })]}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("7. archived announcement is filtered out", () => {
    const { container } = render(
      <PublicAnnouncementList
        announcements={[
          makeAnnouncement({ archivedAt: new Date("2026-06-16T10:00:00.000Z") }),
        ]}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("8. expired announcement is filtered out", () => {
    const { container } = render(
      <PublicAnnouncementList
        announcements={[
          makeAnnouncement({ expiresAt: new Date("2020-01-01T00:00:00.000Z") }),
        ]}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("9. priority badge renders with correct label", () => {
    render(
      <PublicAnnouncementList announcements={[makeAnnouncement({ priority: "HIGH" })]} />,
    );
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("10. published date renders", () => {
    render(<PublicAnnouncementList announcements={[makeAnnouncement()]} />);
    expect(screen.getByText(/Published/)).toBeInTheDocument();
    expect(screen.getByText(/15 Jun 2026/)).toBeInTheDocument();
  });

  it("11. expiry date renders when present", () => {
    render(
      <PublicAnnouncementList
        announcements={[
          makeAnnouncement({ expiresAt: new Date("2026-07-20T00:00:00.000Z") }),
        ]}
      />,
    );
    expect(screen.getByText(/Expires/)).toBeInTheDocument();
    expect(screen.getByText(/20 Jul 2026/)).toBeInTheDocument();
  });

  it("12. no admin or student controls present", () => {
    render(<PublicAnnouncementList announcements={[makeAnnouncement()]} />);
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Archive")).not.toBeInTheDocument();
    expect(screen.queryByText("Publish")).not.toBeInTheDocument();
    expect(screen.queryByText("Restore")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText(/Create Notice/i)).not.toBeInTheDocument();
  });
});
