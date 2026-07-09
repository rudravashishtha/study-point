import { describe, it, expect } from "vitest";
import { validateCurriculumTrack } from "./validation";
import { ClassLevel } from "@prisma/client";

describe("Curriculum Invariants Validation", () => {
  it("allows valid CBSE track", () => {
    const result = validateCurriculumTrack({
      boardCode: "CBSE",
      classLevel: ClassLevel.X,
    });
    expect(result.valid).toBe(true);
  });

  it("rejects CBSE track with a programme", () => {
    const result = validateCurriculumTrack({
      boardCode: "CBSE",
      programmeCode: "ICSE",
      classLevel: ClassLevel.X,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/CBSE tracks cannot have a programme/);
  });

  it("rejects CISCE track without a programme", () => {
    const result = validateCurriculumTrack({
      boardCode: "CISCE",
      classLevel: ClassLevel.IX,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/CISCE tracks must have a programme/);
  });

  it("allows valid CISCE ICSE track for Class IX and X", () => {
    const result9 = validateCurriculumTrack({
      boardCode: "CISCE",
      programmeCode: "ICSE",
      classLevel: ClassLevel.IX,
    });
    expect(result9.valid).toBe(true);

    const result10 = validateCurriculumTrack({
      boardCode: "CISCE",
      programmeCode: "ICSE",
      classLevel: ClassLevel.X,
    });
    expect(result10.valid).toBe(true);
  });

  it("rejects CISCE ICSE track for Class XI and XII", () => {
    const result11 = validateCurriculumTrack({
      boardCode: "CISCE",
      programmeCode: "ICSE",
      classLevel: ClassLevel.XI,
    });
    expect(result11.valid).toBe(false);
    expect(result11.error).toMatch(/ICSE is only valid for Classes IX and X/);
  });

  it("allows valid CISCE ISC track for Class XI and XII", () => {
    const result11 = validateCurriculumTrack({
      boardCode: "CISCE",
      programmeCode: "ISC",
      classLevel: ClassLevel.XI,
    });
    expect(result11.valid).toBe(true);
  });

  it("rejects CISCE ISC track for Class IX and X", () => {
    const result9 = validateCurriculumTrack({
      boardCode: "CISCE",
      programmeCode: "ISC",
      classLevel: ClassLevel.IX,
    });
    expect(result9.valid).toBe(false);
    expect(result9.error).toMatch(/ISC is only valid for Classes XI and XII/);
  });
});
