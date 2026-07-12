// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StudentTimetableGrid } from "./StudentTimetableGrid";

afterEach(() => {
  cleanup();
});

function makeSchedule(overrides: Record<string, unknown> = {}) {
  return {
    id: "s-1",
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "10:00",
    roomOrLocation: null,
    liveClassUrl: null,
    batch: {
      id: "b-1",
      name: "Batch A",
      curriculumTrack: {
        subject: { name: "Mathematics" },
      },
    },
    ...overrides,
  };
}

describe("StudentTimetableGrid", () => {
  it("1. returns null for empty schedule", () => {
    const { container } = render(<StudentTimetableGrid groups={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("2. renders a day group heading", () => {
    render(
      <StudentTimetableGrid
        groups={[
          {
            dayOfWeek: 1,
            dayLabel: "Monday",
            schedules: [makeSchedule()],
          },
        ]}
      />,
    );
    expect(screen.getByText("Monday")).toBeInTheDocument();
  });

  it("3. shows 'Today' badge for current day", () => {
    const today = new Date().getDay();
    render(
      <StudentTimetableGrid
        groups={[
          {
            dayOfWeek: today,
            dayLabel: "Monday",
            schedules: [makeSchedule({ dayOfWeek: today })],
          },
        ]}
      />,
    );
    const badges = screen.getAllByText("Today");
    expect(badges.length).toBe(1);
    expect(badges[0].tagName).toBe("SPAN");
  });

  it("4. renders multiple day groups in order", () => {
    const { container } = render(
      <StudentTimetableGrid
        groups={[
          {
            dayOfWeek: 1,
            dayLabel: "Monday",
            schedules: [makeSchedule({ dayOfWeek: 1 })],
          },
          {
            dayOfWeek: 3,
            dayLabel: "Wednesday",
            schedules: [makeSchedule({ id: "s-2", dayOfWeek: 3, startTime: "11:00" })],
          },
        ]}
      />,
    );
    const headings = container.querySelectorAll("h3");
    expect(headings[0]).toHaveTextContent("Monday");
    expect(headings[1]).toHaveTextContent("Wednesday");
  });

  it("5. renders schedule time range", () => {
    render(
      <StudentTimetableGrid
        groups={[
          {
            dayOfWeek: 1,
            dayLabel: "Monday",
            schedules: [makeSchedule()],
          },
        ]}
      />,
    );
    expect(screen.getByText(/9:00 AM/)).toBeInTheDocument();
    expect(screen.getByText(/10:00 AM/)).toBeInTheDocument();
  });

  it("6. shows batch name", () => {
    render(
      <StudentTimetableGrid
        groups={[
          {
            dayOfWeek: 1,
            dayLabel: "Monday",
            schedules: [makeSchedule()],
          },
        ]}
      />,
    );
    expect(screen.getByText("Batch A")).toBeInTheDocument();
  });

  it("7. shows subject name from curriculumTrack", () => {
    render(
      <StudentTimetableGrid
        groups={[
          {
            dayOfWeek: 1,
            dayLabel: "Monday",
            schedules: [makeSchedule()],
          },
        ]}
      />,
    );
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
  });

  it("8. shows room or location when present", () => {
    render(
      <StudentTimetableGrid
        groups={[
          {
            dayOfWeek: 1,
            dayLabel: "Monday",
            schedules: [makeSchedule({ roomOrLocation: "Room 101" })],
          },
        ]}
      />,
    );
    expect(screen.getByText("Room 101")).toBeInTheDocument();
  });

  it("9. shows live class link when present", () => {
    render(
      <StudentTimetableGrid
        groups={[
          {
            dayOfWeek: 1,
            dayLabel: "Monday",
            schedules: [makeSchedule({ liveClassUrl: "https://meet.example.com/abc" })],
          },
        ]}
      />,
    );
    const link = screen.getByText("Join");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "https://meet.example.com/abc");
    expect(link.closest("a")).toHaveAttribute("target", "_blank");
  });

  it("10. multiple schedules in one day group", () => {
    render(
      <StudentTimetableGrid
        groups={[
          {
            dayOfWeek: 1,
            dayLabel: "Monday",
            schedules: [
              makeSchedule({ id: "s-1", startTime: "09:00" }),
              makeSchedule({ id: "s-2", startTime: "11:00" }),
            ],
          },
        ]}
      />,
    );
    expect(screen.getByText(/9:00 AM/)).toBeInTheDocument();
    expect(screen.getByText(/11:00 AM/)).toBeInTheDocument();
  });
});
