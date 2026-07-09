import { ClassLevel } from "@prisma/client";

export type CurriculumInput = {
  boardCode: string;
  programmeCode?: string | null;
  classLevel: ClassLevel;
};

export function validateCurriculumTrack(input: CurriculumInput): {
  valid: boolean;
  error?: string;
} {
  const { boardCode, programmeCode, classLevel } = input;

  if (boardCode === "CBSE") {
    if (programmeCode) {
      return { valid: false, error: "CBSE tracks cannot have a programme." };
    }
  } else if (boardCode === "CISCE") {
    if (!programmeCode) {
      return { valid: false, error: "CISCE tracks must have a programme (ICSE or ISC)." };
    }

    if (programmeCode === "ICSE") {
      if (classLevel !== ClassLevel.IX && classLevel !== ClassLevel.X) {
        return { valid: false, error: "ICSE is only valid for Classes IX and X." };
      }
    } else if (programmeCode === "ISC") {
      if (classLevel !== ClassLevel.XI && classLevel !== ClassLevel.XII) {
        return { valid: false, error: "ISC is only valid for Classes XI and XII." };
      }
    } else {
      return { valid: false, error: "Invalid CISCE programme." };
    }
  } else {
    return { valid: false, error: "Unsupported board." };
  }

  return { valid: true };
}
