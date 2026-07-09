// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

import { TeacherRowActions } from "./TeacherRowActions";
import { TeacherWithAppUser } from "./TeacherList";
import * as actions from "@/app/admin/teachers/actions";

afterEach(() => {
  cleanup();
});

vi.mock("@/app/admin/teachers/actions", () => ({
  inviteTeacherAction: vi.fn(),
  archiveTeacherAction: vi.fn(),
  restoreTeacherAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("TeacherRowActions Provisioning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseTeacher: TeacherWithAppUser = {
    id: "t1",
    displayName: "Teacher One",
    email: "teacher1@example.com",
    phone: null,
    bio: null,
    qualifications: null,
    photoFileId: null,
    active: true,
    appUser: null,
  };

  it("eligible active unprovisioned Teacher can be invited", () => {
    render(<TeacherRowActions teacher={baseTeacher} />);

    // Open dropdown
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    // Ensure "Invite Teacher" is present
    const inviteItem = screen.getByText("Invite Teacher");
    expect(inviteItem).toBeInTheDocument();
  });

  it("inactive Teacher cannot be invited", () => {
    render(<TeacherRowActions teacher={{ ...baseTeacher, active: false }} />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.queryByText("Invite Teacher")).not.toBeInTheDocument();
  });

  it("Teacher without email cannot be invited", () => {
    render(<TeacherRowActions teacher={{ ...baseTeacher, email: null }} />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.queryByText("Invite Teacher")).not.toBeInTheDocument();
  });

  it("INVITED Teacher cannot be invited", () => {
    render(
      <TeacherRowActions teacher={{ ...baseTeacher, appUser: { status: "INVITED" } }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.queryByText("Invite Teacher")).not.toBeInTheDocument();
  });

  it("ACTIVE Teacher cannot be invited", () => {
    render(
      <TeacherRowActions teacher={{ ...baseTeacher, appUser: { status: "ACTIVE" } }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.queryByText("Invite Teacher")).not.toBeInTheDocument();
  });

  it("DISABLED Teacher cannot be invited", () => {
    render(
      <TeacherRowActions teacher={{ ...baseTeacher, appUser: { status: "DISABLED" } }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.queryByText("Invite Teacher")).not.toBeInTheDocument();
  });

  it("Teacher client submits no role or Supabase Auth ID", async () => {
    vi.mocked(actions.inviteTeacherAction).mockResolvedValueOnce({
      success: true,
      data: undefined,
    });
    render(<TeacherRowActions teacher={baseTeacher} />);

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const inviteItem = screen.getByText("Invite Teacher");

    fireEvent.click(inviteItem);

    await waitFor(() => {
      expect(actions.inviteTeacherAction).toHaveBeenCalledWith("t1");
    });
    // Ensure only the ID is passed
    expect(vi.mocked(actions.inviteTeacherAction).mock.calls[0].length).toBe(1);
  });
});
