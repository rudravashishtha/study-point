// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StudentFeeStatus } from "./StudentFeeStatus";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});

function makeAssignment(overrides: Record<string, unknown> = {}) {
  return {
    id: "fa-1",
    feePlan: { id: "fp-1", name: "Term Plan" },
    enrolment: {
      batch: { id: "b-1", name: "Batch A" },
      curriculumTrack: { subject: { name: "Mathematics" } },
    },
    dues: [
      {
        id: "due-1",
        label: "Instalment 1",
        dueDate: "2026-08-01T00:00:00.000Z",
        amountDue: "5000.00",
        amountWaived: "0.00",
        status: "PENDING",
      },
    ],
    ...overrides,
  };
}

describe("StudentFeeStatus", () => {
  it("1. returns null for empty assignments", () => {
    const { container } = render(<StudentFeeStatus assignments={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("2. shows pending total in summary", () => {
    render(<StudentFeeStatus assignments={[makeAssignment()]} />);
    expect(screen.getByText("Settled")).toBeInTheDocument();
    expect(screen.getByText("Plan Total")).toBeInTheDocument();
    const totals = screen.getAllByText("₹5000.00");
    expect(totals.length).toBeGreaterThanOrEqual(2);
    expect(totals[0].className).toContain("font-heading");
  });

  it("3. shows fee plan name", () => {
    render(<StudentFeeStatus assignments={[makeAssignment()]} />);
    expect(screen.getByText("Term Plan")).toBeInTheDocument();
  });

  it("4. shows batch and subject", () => {
    render(<StudentFeeStatus assignments={[makeAssignment()]} />);
    expect(screen.getByText(/Batch A/)).toBeInTheDocument();
    expect(screen.getByText(/Mathematics/)).toBeInTheDocument();
  });

  it("5. renders individual due row", () => {
    render(<StudentFeeStatus assignments={[makeAssignment()]} />);
    expect(screen.getByText("Instalment 1")).toBeInTheDocument();
    expect(screen.getByText("Due 1 Aug 2026")).toBeInTheDocument();
  });

  it("6. shows status badge per due", () => {
    render(<StudentFeeStatus assignments={[makeAssignment()]} />);
    expect(screen.getAllByText("Pending").length).toBeGreaterThanOrEqual(1);
  });

  it("7. excludes CANCELLED dues from totals", () => {
    const assignment = makeAssignment({
      dues: [
        {
          id: "due-1",
          label: "Instalment 1",
          dueDate: "2026-08-01T00:00:00.000Z",
          amountDue: "5000.00",
          amountWaived: "0.00",
          status: "PENDING",
        },
        {
          id: "due-2",
          label: "Cancelled Instalment",
          dueDate: "2026-09-01T00:00:00.000Z",
          amountDue: "3000.00",
          amountWaived: "0.00",
          status: "CANCELLED",
        },
      ],
    });
    render(<StudentFeeStatus assignments={[assignment]} />);
    const totals = screen.getAllByText("₹5000.00");
    expect(totals[0].className).toContain("font-heading");
    // Cancelled dues are still rendered, but with a Cancelled badge.
    expect(screen.getByText("Cancelled Instalment")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("8. PAID dues do not count toward pending total", () => {
    const assignment = makeAssignment({
      dues: [
        {
          id: "due-1",
          label: "Paid Instalment",
          dueDate: "2026-08-01T00:00:00.000Z",
          amountDue: "5000.00",
          amountWaived: "0.00",
          status: "PAID",
        },
        {
          id: "due-2",
          label: "Pending Instalment",
          dueDate: "2026-09-01T00:00:00.000Z",
          amountDue: "2000.00",
          amountWaived: "0.00",
          status: "PENDING",
        },
      ],
    });
    render(<StudentFeeStatus assignments={[assignment]} />);
    const totals = screen.getAllByText("₹2000.00");
    expect(totals[0].className).toContain("font-heading");
    expect(screen.getByText("Pending Instalment")).toBeInTheDocument();
  });

  it("9. multiple assignments shown", () => {
    const a2 = makeAssignment({
      id: "fa-2",
      feePlan: { id: "fp-2", name: "Annual Plan" },
      dues: [
        {
          id: "due-3",
          label: "Annual Fee",
          dueDate: "2026-10-01T00:00:00.000Z",
          amountDue: "10000.00",
          amountWaived: "0.00",
          status: "OVERDUE",
        },
      ],
    });
    render(<StudentFeeStatus assignments={[makeAssignment(), a2]} />);
    expect(screen.getByText("Term Plan")).toBeInTheDocument();
    expect(screen.getByText("Annual Plan")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("10. applies waived amount to net due", () => {
    const assignment = makeAssignment({
      dues: [
        {
          id: "due-1",
          label: "Waived Instalment",
          dueDate: "2026-08-01T00:00:00.000Z",
          amountDue: "5000.00",
          amountWaived: "5000.00",
          status: "WAIVED",
        },
        {
          id: "due-2",
          label: "Pending Instalment",
          dueDate: "2026-09-01T00:00:00.000Z",
          amountDue: "2000.00",
          amountWaived: "0.00",
          status: "PENDING",
        },
      ],
    });
    render(<StudentFeeStatus assignments={[assignment]} />);
    const totals = screen.getAllByText("₹2000.00");
    expect(totals[0].className).toContain("font-heading");
    expect(screen.getByText("Waived")).toBeInTheDocument();
  });

  it("11. shows a receipt link only for paid dues", () => {
    const assignment = makeAssignment({
      dues: [
        {
          id: "due-paid",
          label: "Paid Instalment",
          dueDate: "2026-08-01T00:00:00.000Z",
          amountDue: "5000.00",
          amountWaived: "0.00",
          status: "PAID",
        },
      ],
    });
    render(<StudentFeeStatus assignments={[assignment]} />);
    const link = screen.getByRole("link", { name: "Receipt" });
    expect(link).toHaveAttribute("href", "/student/fees/receipt/due-paid");
  });

  it("12. does not show a receipt link for unpaid dues", () => {
    render(<StudentFeeStatus assignments={[makeAssignment()]} />);
    expect(screen.queryByRole("link", { name: "Receipt" })).toBeNull();
  });
});
