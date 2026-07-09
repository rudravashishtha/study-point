import { describe, it, expect } from "vitest";
import { getAvailableTeachersForBatch } from "./teacher-availability";

describe("Teacher Availability Domain Logic", () => {
  it("inactive Teachers are excluded from assignment candidates", () => {
    const candidates = getAvailableTeachersForBatch(
      [
        { id: "t1", active: true },
        { id: "t2", active: false },
      ],
      [],
    );
    expect(candidates.map((t) => t.id)).toEqual(["t1"]);
  });

  it("Teachers with an active assignment to the current Batch are excluded", () => {
    const candidates = getAvailableTeachersForBatch(
      [
        { id: "t1", active: true },
        { id: "t2", active: true },
      ],
      [{ teacherId: "t1", archivedAt: null }],
    );
    expect(candidates.map((t) => t.id)).toEqual(["t2"]);
  });

  it("Teachers with only historical assignments remain eligible", () => {
    const candidates = getAvailableTeachersForBatch(
      [
        { id: "t1", active: true },
        { id: "t2", active: true },
      ],
      [{ teacherId: "t1", archivedAt: new Date() }],
    );
    expect(candidates.map((t) => t.id)).toEqual(["t1", "t2"]);
  });
});
