import { describe, it, expect } from "vitest";
import {
  createBoardSchema,
  updateBoardSchema,
  createProgrammeSchema,
  updateProgrammeSchema,
  createSubjectSchema,
  updateSubjectSchema,
} from "./curriculum";

describe("Curriculum Validation", () => {
  it("Board create schema validates correctly", () => {
    expect(createBoardSchema.parse({ code: "CBSE", name: "CBSE Board" })).toEqual({
      code: "CBSE",
      name: "CBSE Board",
    });
  });

  it("Code normalization rules and empty-after-trim rejection", () => {
    // Empty after trim
    expect(() => createBoardSchema.parse({ code: "   ", name: "Name" })).toThrow(
      "Code is required",
    );
    // Invalid characters
    expect(() => createBoardSchema.parse({ code: "cbse", name: "Name" })).toThrow(
      "uppercase alphanumeric",
    );
    expect(() => createBoardSchema.parse({ code: "CBSE BOARD", name: "Name" })).toThrow(
      "without spaces",
    );
    // Valid characters
    expect(createBoardSchema.parse({ code: "CBSE_2026", name: "Name" })).toEqual({
      code: "CBSE_2026",
      name: "Name",
    });
  });

  it("Prohibited lifecycle fields on update schema", () => {
    expect(() =>
      updateBoardSchema.parse({ name: "Updated", archivedAt: new Date() }),
    ).toThrow();
    expect(() =>
      updateProgrammeSchema.parse({ name: "Updated", createdBy: "user1" }),
    ).toThrow();
    expect(() => updateSubjectSchema.parse({ name: "Updated", active: false })).toThrow();
  });

  it("Programme update rejection of boardId and code", () => {
    expect(() =>
      updateProgrammeSchema.parse({ name: "Updated", boardId: "some-uuid" }),
    ).toThrow();
    expect(() =>
      updateProgrammeSchema.parse({ name: "Updated", code: "ICSE" }),
    ).toThrow();
  });

  it("Programme create schema validates correctly", () => {
    const validUuid = "00000000-0000-4000-8000-000000000001";
    expect(
      createProgrammeSchema.parse({
        boardId: validUuid,
        code: "ICSE",
        name: "ICSE Prog",
      }),
    ).toEqual({
      boardId: validUuid,
      code: "ICSE",
      name: "ICSE Prog",
    });
  });

  it("Subject create schema validates correctly", () => {
    expect(createSubjectSchema.parse({ code: "MATH", name: "Mathematics" })).toEqual({
      code: "MATH",
      name: "Mathematics",
    });
  });

  it("Update rejection of code on subject", () => {
    expect(() => updateSubjectSchema.parse({ name: "Math 2", code: "MATH2" })).toThrow();
  });
});
