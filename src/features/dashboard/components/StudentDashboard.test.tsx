// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StudentDashboard } from "./StudentDashboard";

afterEach(() => {
  cleanup();
});

function makeData(overrides: Record<string, any> = {}) {
  return {
    timetable: {
      groups: [
        {
          dayOfWeek: new Date().getDay(),
          dayLabel: "Today",
          schedules: [
            {
              id: "s-1",
              startTime: "09:00",
              endTime: "10:00",
              batch: {
                name: "Batch A",
                curriculumTrack: { subject: { name: "Mathematics" } },
              },
            },
          ],
        },
      ],
    },
    announcements: {
      items: [
        {
          id: "a-1",
          title: "Holiday Notice",
          publishedAt: "2026-06-15T10:00:00.000Z",
        },
      ],
    },
    homework: {
      items: [
        {
          id: "h-1",
          title: "Exercise 5",
          dueDate: "2026-08-01T00:00:00.000Z",
        },
      ],
    },
    tests: {
      items: [
        {
          id: "t-1",
          title: "Chapter Test",
          testDate: "2026-08-10T00:00:00.000Z",
        },
      ],
    },
    fees: {
      assignments: [
        {
          id: "fa-1",
          dues: [
            {
              id: "due-1",
              status: "PENDING",
              amountDue: "5000.00",
              amountWaived: "0.00",
            },
          ],
        },
      ],
    },
    ...overrides,
  };
}

describe("StudentDashboard", () => {
  it("1. renders all five widget cards", () => {
    render(<StudentDashboard data={makeData()} />);
    expect(screen.getByText("Next Class")).toBeInTheDocument();
    expect(screen.getByText("Fee Status")).toBeInTheDocument();
    expect(screen.getByText("Homework")).toBeInTheDocument();
    expect(screen.getByText("Tests")).toBeInTheDocument();
    expect(screen.getByText("Notices")).toBeInTheDocument();
  });

  it("2. shows next class with subject and time", () => {
    render(<StudentDashboard data={makeData()} />);
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    expect(screen.getByText(/9:00 AM/)).toBeInTheDocument();
  });

  it("3. shows pending fee total", () => {
    render(<StudentDashboard data={makeData()} />);
    expect(screen.getByText("₹5000.00")).toBeInTheDocument();
  });

  it("4. shows homework item", () => {
    render(<StudentDashboard data={makeData()} />);
    expect(screen.getByText("Exercise 5")).toBeInTheDocument();
    expect(screen.getByText(/1 Aug 2026/)).toBeInTheDocument();
  });

  it("5. shows test item", () => {
    render(<StudentDashboard data={makeData()} />);
    expect(screen.getByText("Chapter Test")).toBeInTheDocument();
    expect(screen.getByText(/10 Aug 2026/)).toBeInTheDocument();
  });

  it("6. shows announcement item", () => {
    render(<StudentDashboard data={makeData()} />);
    expect(screen.getByText("Holiday Notice")).toBeInTheDocument();
  });

  it("7. shows empty text when no timetable", () => {
    render(<StudentDashboard data={makeData({ timetable: { groups: [] } })} />);
    expect(screen.getByText("No upcoming classes scheduled.")).toBeInTheDocument();
  });

  it("8. shows empty text when no homework", () => {
    render(<StudentDashboard data={makeData({ homework: { items: [] } })} />);
    expect(screen.getByText("No homework assigned.")).toBeInTheDocument();
  });

  it("9. shows empty text when no fees", () => {
    render(<StudentDashboard data={makeData({ fees: { assignments: [] } })} />);
    expect(screen.getByText("No fee records yet.")).toBeInTheDocument();
  });

  it("10. shows zero pending when all dues paid", () => {
    const data = makeData({
      fees: {
        assignments: [
          {
            id: "fa-1",
            dues: [
              {
                id: "due-1",
                status: "PAID",
                amountDue: "5000.00",
                amountWaived: "0.00",
              },
            ],
          },
        ],
      },
    });
    render(<StudentDashboard data={data} />);
    expect(screen.getByText("₹0.00")).toBeInTheDocument();
  });
});
