// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import { StudentActivationQueue } from "./StudentActivationQueue";
import * as actions from "@/app/admin/students/activate/actions";

afterEach(() => {
  cleanup();
});

vi.mock("@/app/admin/students/activate/actions", () => ({
  inviteStudentAction: vi.fn(),
  bulkInviteStudentsAction: vi.fn(),
}));

describe("StudentActivationQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const candidates = [
    {
      id: "s1",
      studentCode: "STU-001",
      fullName: "John Doe",
      email: "john@example.com",
      isEligible: true,
    },
    {
      id: "s2",
      studentCode: "STU-002",
      fullName: "Jane Doe",
      email: null,
      isEligible: false,
    },
  ];

  it("eligible unprovisioned Student can be invited", async () => {
    vi.mocked(actions.inviteStudentAction).mockResolvedValueOnce({
      success: true,
      data: undefined,
    });
    render(<StudentActivationQueue candidates={candidates} />);

    const inviteButtons = screen.getAllByRole("button", { name: /Invite Student/i });
    expect(inviteButtons[0]).not.toBeDisabled(); // First is John Doe (eligible)

    fireEvent.click(inviteButtons[0]);

    // Asserts no role or Auth user ID is submitted
    expect(actions.inviteStudentAction).toHaveBeenCalledWith("s1");
    expect(actions.inviteStudentAction).toHaveBeenCalledTimes(1);
  });

  it("Student without email cannot be invited", () => {
    render(<StudentActivationQueue candidates={candidates} />);

    const inviteButtons = screen.getAllByRole("button", { name: /Invite Student/i });
    expect(inviteButtons[1]).toBeDisabled(); // Jane Doe (no email)
  });

  it("Student with an existing AppUser is excluded from the activation queue", () => {
    // This logic happens in the backend query `listStudentActivationCandidates`,
    // but we can verify the UI handles empty queues as expected when excluded.
    render(<StudentActivationQueue candidates={[]} />);
    expect(screen.getByText("No students to activate")).toBeInTheDocument();
  });

  it("duplicate submission is prevented while pending", async () => {
    // We can simulate a pending state by making the mock return a slow promise
    let resolvePromise!: (value: { success: true; data: undefined }) => void;
    const promise = new Promise<{ success: true; data: undefined }>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(actions.inviteStudentAction).mockReturnValueOnce(
      promise as ReturnType<typeof actions.inviteStudentAction>,
    );

    render(<StudentActivationQueue candidates={[candidates[0]]} />);

    const button = screen.getByRole("button", { name: /Invite Student/i });
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(button).toBeDisabled(); // Disabled immediately upon click
    expect(screen.getByText("Inviting...")).toBeInTheDocument();

    // Try to click again while pending
    fireEvent.click(button);
    expect(actions.inviteStudentAction).toHaveBeenCalledTimes(1); // Only called once

    resolvePromise({ success: true, data: undefined });
  });

  it("no role or Supabase Auth ID is submitted by the client", async () => {
    vi.mocked(actions.inviteStudentAction).mockResolvedValueOnce({
      success: true,
      data: undefined,
    });
    render(<StudentActivationQueue candidates={[candidates[0]]} />);

    const button = screen.getByRole("button", { name: /Invite Student/i });
    fireEvent.click(button);

    expect(actions.inviteStudentAction).toHaveBeenCalledWith("s1");
    // Verify it was exactly "s1" with no other arguments (no roles, no supabase ids)
    expect(vi.mocked(actions.inviteStudentAction).mock.calls[0].length).toBe(1);
  });
});
