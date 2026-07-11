import { db } from "../../lib/db";
import { QuestionType, QuestionDifficulty } from "@prisma/client";
import * as XLSX from "xlsx";
import { ServiceResult, success, failure } from "./types";
import { ActorContext } from "../../lib/domain/actor";
import { createAuditLog } from "../../lib/domain/audit";
import { validateCurriculumTrack } from "../../lib/curriculum/validation";
import {
  resolveBoard,
  resolveProgramme,
  resolveCurriculumTrack,
  resolveChapter,
  resolveTopic,
} from "../../lib/curriculum/resolvers";
import { ClassLevel } from "@prisma/client";

export const QUESTION_EXPECTED_HEADERS = [
  "board",
  "programme",
  "class level",
  "subject",
  "chapter",
  "topic",
  "question text",
  "question type",
  "difficulty",
  "marks",
  "answer text",
  "solution text",
  "source",
] as const;

const VALID_QUESTION_TYPES = [
  "short answer",
  "long answer",
  "mcq",
  "numerical",
  "proof",
  "assertion reason",
  "case study",
  "other",
] as const;

const VALID_DIFFICULTIES = ["easy", "medium", "hard"] as const;

const VALID_CLASS_LEVELS = ["ix", "x", "xi", "xii"] as const;

interface ValidationProblem {
  column: string;
  problem: string;
  expectedValue: string;
}

interface ParsedRow {
  data: Record<string, string>;
  status: "VALID" | "WARNING" | "ERROR";
  errors: ValidationProblem[];
  warnings: ValidationProblem[];
}

function getExpectedValue(column: string): string {
  const expectations: Record<string, string> = {
    board: "CBSE or CISCE",
    programme: "ICSE or ISC (required for CISCE, leave empty for CBSE)",
    classLevel: "IX, X, XI, or XII",
    subject: "MATHEMATICS",
    chapter: "A valid chapter name in this curriculum track",
    topic: "A valid topic name in this chapter (optional)",
    questionText: "Question text between 1-5000 characters",
    questionType: VALID_QUESTION_TYPES.join(", "),
    difficulty: VALID_DIFFICULTIES.join(", "),
    marks: "A positive integer",
    answerText: "Answer text (optional)",
    solutionText: "Solution text (optional)",
    source: "Source reference (optional)",
  };
  return expectations[column] || "Valid value";
}

function buildHeaderMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  QUESTION_EXPECTED_HEADERS.forEach((expected) => {
    const lower = expected.toLowerCase();
    const found = headers.find((h) => h.toLowerCase().trim() === lower);
    if (found) {
      mapping[expected] = found;
    }
  });
  return mapping;
}

function normalizeQuestionType(raw: string): string | null {
  const cleaned = raw.trim().toLowerCase();
  if (VALID_QUESTION_TYPES.includes(cleaned as (typeof VALID_QUESTION_TYPES)[number])) {
    return cleaned.replace(/\s+/g, "_");
  }
  return null;
}

function normalizeDifficulty(raw: string): string | null {
  const cleaned = raw.trim().toLowerCase();
  if (VALID_DIFFICULTIES.includes(cleaned as (typeof VALID_DIFFICULTIES)[number])) {
    return cleaned.toUpperCase();
  }
  return null;
}

function normalizeClassLevel(raw: string): string | null {
  const cleaned = raw.trim().toLowerCase();
  if (VALID_CLASS_LEVELS.includes(cleaned as (typeof VALID_CLASS_LEVELS)[number])) {
    return cleaned.toUpperCase();
  }
  return null;
}

export function validateQuestionHeaders(
  headers: string[],
): ServiceResult<{ normalizedHeaders: string[] }> {
  const trimmed = headers.map((h) => h.trim());

  if (trimmed.some((h) => h === "")) {
    return failure("IMPORT_VALIDATION", "Header row contains empty column names");
  }

  const lowerHeaders = trimmed.map((h) => h.toLowerCase());
  const expected = QUESTION_EXPECTED_HEADERS.map((h) => h.toLowerCase());

  const invalidHeaders = lowerHeaders.filter((h) => !expected.includes(h));
  if (invalidHeaders.length > 0) {
    return failure(
      "IMPORT_VALIDATION",
      `Unexpected headers: ${invalidHeaders.join(", ")}. Expected: ${QUESTION_EXPECTED_HEADERS.join(", ")}`,
    );
  }

  const requiredHeaders = [
    "board",
    "class level",
    "subject",
    "chapter",
    "question text",
    "question type",
    "difficulty",
    "marks",
  ];
  const missingRequired = requiredHeaders.filter((r) => !lowerHeaders.includes(r));
  if (missingRequired.length > 0) {
    return failure(
      "IMPORT_VALIDATION",
      `Required headers missing: ${missingRequired.join(", ")}`,
    );
  }

  return success({ normalizedHeaders: QUESTION_EXPECTED_HEADERS as unknown as string[] });
}

export async function validateQuestionRows(
  rows: Record<string, string>[],
  headers: string[],
): Promise<{
  parsedRows: ParsedRow[];
}> {
  const headerMapping = buildHeaderMapping(headers);
  const parsedRows: ParsedRow[] = [];

  for (const row of rows) {
    const problems: ValidationProblem[] = [];
    const warnings: ValidationProblem[] = [];

    const board = row[headerMapping["board"] || "board"]?.trim() || "";
    const programme = row[headerMapping["programme"] || "programme"]?.trim() || "";
    const classLevelRaw =
      row[headerMapping["class level"] || "class level"]?.trim() || "";
    const subject = row[headerMapping["subject"] || "subject"]?.trim() || "";
    const chapter = row[headerMapping["chapter"] || "chapter"]?.trim() || "";
    const topic = row[headerMapping["topic"] || "topic"]?.trim() || "";
    const questionText =
      row[headerMapping["question text"] || "question text"]?.trim() || "";
    const questionTypeRaw =
      row[headerMapping["question type"] || "question type"]?.trim() || "";
    const difficultyRaw = row[headerMapping["difficulty"] || "difficulty"]?.trim() || "";
    const marksRaw = row[headerMapping["marks"] || "marks"]?.trim() || "";
    const answerText = row[headerMapping["answer text"] || "answer text"]?.trim() || "";
    const solutionText =
      row[headerMapping["solution text"] || "solution text"]?.trim() || "";
    const source = row[headerMapping["source"] || "source"]?.trim() || "";

    if (!board) {
      problems.push({
        column: "Board",
        problem: "Board is required",
        expectedValue: getExpectedValue("board"),
      });
    }

    if (!classLevelRaw) {
      problems.push({
        column: "Class Level",
        problem: "Class level is required",
        expectedValue: getExpectedValue("classLevel"),
      });
    }

    if (!subject) {
      problems.push({
        column: "Subject",
        problem: "Subject is required",
        expectedValue: getExpectedValue("subject"),
      });
    }

    if (!chapter) {
      problems.push({
        column: "Chapter",
        problem: "Chapter is required",
        expectedValue: getExpectedValue("chapter"),
      });
    }

    if (!questionText) {
      problems.push({
        column: "Question Text",
        problem: "Question text is required",
        expectedValue: getExpectedValue("questionText"),
      });
    } else if (questionText.length > 5000) {
      problems.push({
        column: "Question Text",
        problem: "Question text exceeds 5000 characters",
        expectedValue: getExpectedValue("questionText"),
      });
    }

    if (!questionTypeRaw) {
      problems.push({
        column: "Question Type",
        problem: "Question type is required",
        expectedValue: getExpectedValue("questionType"),
      });
    } else if (!normalizeQuestionType(questionTypeRaw)) {
      problems.push({
        column: "Question Type",
        problem: `Invalid question type: "${questionTypeRaw}"`,
        expectedValue: getExpectedValue("questionType"),
      });
    }

    if (!difficultyRaw) {
      problems.push({
        column: "Difficulty",
        problem: "Difficulty is required",
        expectedValue: getExpectedValue("difficulty"),
      });
    } else if (!normalizeDifficulty(difficultyRaw)) {
      problems.push({
        column: "Difficulty",
        problem: `Invalid difficulty: "${difficultyRaw}"`,
        expectedValue: getExpectedValue("difficulty"),
      });
    }

    if (!marksRaw) {
      problems.push({
        column: "Marks",
        problem: "Marks is required",
        expectedValue: getExpectedValue("marks"),
      });
    } else {
      const marksNum = parseInt(marksRaw, 10);
      if (isNaN(marksNum) || marksNum <= 0) {
        problems.push({
          column: "Marks",
          problem: `Invalid marks: "${marksRaw}"`,
          expectedValue: getExpectedValue("marks"),
        });
      }
    }

    const normClassLevel = normalizeClassLevel(classLevelRaw);
    if (classLevelRaw && !normClassLevel) {
      problems.push({
        column: "Class Level",
        problem: `Invalid class level: "${classLevelRaw}"`,
        expectedValue: getExpectedValue("classLevel"),
      });
    }

    if (board) {
      const curriculumValidation = validateCurriculumTrack({
        boardCode: board.toUpperCase(),
        programmeCode: programme ? programme.toUpperCase() : null,
        classLevel: (normClassLevel || "IX") as ClassLevel,
      });
      if (!curriculumValidation.valid) {
        problems.push({
          column: "Board/Programme",
          problem: curriculumValidation.error || "Invalid board/programme combination",
          expectedValue: getExpectedValue("board"),
        });
      }
    }

    if (problems.length > 0) {
      parsedRows.push({ data: row, status: "ERROR", errors: problems, warnings });
      continue;
    }

    const mapped: Record<string, string> = {
      board: board.toUpperCase(),
      programme: programme ? programme.toUpperCase() : "",
      classLevel: normClassLevel || "",
      subject: subject.toUpperCase(),
      chapter,
      topic,
      questionText,
      questionType: normalizeQuestionType(questionTypeRaw) || "",
      difficulty: normalizeDifficulty(difficultyRaw) || "",
      marks: marksRaw,
      answerText,
      solutionText,
      source,
    };

    parsedRows.push({ data: mapped, status: "VALID", errors: [], warnings });
  }

  return { parsedRows };
}

export async function confirmQuestionImport(
  validRowList: { id: string; rowNumber: number; data: unknown }[],
  jobId: string,
  actor: ActorContext,
): Promise<{
  importedCount: number;
  failedCount: number;
}> {
  let importedCount = 0;
  let failedCount = 0;

  await db.$transaction(async (tx) => {
    for (const row of validRowList) {
      try {
        const rawData = row.data as Record<string, string>;

        const classLevel = rawData["classLevel"] as ClassLevel;

        const boardResult = await resolveBoard(rawData["board"]);
        if (!boardResult.success) {
          failedCount++;
          continue;
        }

        const programmeResult = await resolveProgramme(
          boardResult.data.id,
          rawData["programme"] || "",
        );
        if (!programmeResult.success) {
          failedCount++;
          continue;
        }

        const trackResult = await resolveCurriculumTrack(
          boardResult.data.id,
          programmeResult.data?.id || null,
          classLevel,
          rawData["subject"],
        );
        if (!trackResult.success) {
          failedCount++;
          continue;
        }

        const chapterResult = await resolveChapter(
          trackResult.data.id,
          rawData["chapter"],
        );
        if (!chapterResult.success) {
          failedCount++;
          continue;
        }

        const topicResult = await resolveTopic(
          chapterResult.data.id,
          rawData["topic"] || null,
        );

        const questionTypeEnum = rawData["questionType"] as QuestionType;
        const difficultyEnum = rawData["difficulty"] as QuestionDifficulty;
        const marksNum = parseInt(rawData["marks"], 10);

        await tx.question.create({
          data: {
            curriculumTrackId: trackResult.data.id,
            chapterId: chapterResult.data.id,
            topicId: topicResult.success ? topicResult.data?.id || null : null,
            questionText: rawData["questionText"],
            questionType: questionTypeEnum,
            difficulty: difficultyEnum,
            marks: marksNum,
            answerText: rawData["answerText"] || null,
            solutionText: rawData["solutionText"] || null,
            source: rawData["source"] || null,
            createdBy: actor.userId,
          },
        });

        await createAuditLog(tx, actor, {
          action: "IMPORT_QUESTION_CREATE",
          entityType: "QUESTION",
          entityId: "",
          summary: `Created question via bulk import (row ${row.rowNumber})`,
          metadata: {
            importJobId: jobId,
            curriculumTrackId: trackResult.data.id,
            chapterId: chapterResult.data.id,
            importRowId: row.id,
          },
        });

        importedCount++;
      } catch {
        failedCount++;
      }
    }
  });

  return { importedCount, failedCount };
}

export function generateQuestionTemplate(): ServiceResult<{
  buffer: Buffer;
  filename: string;
}> {
  try {
    const wb = XLSX.utils.book_new();
    const wsData = [
      [
        "Board",
        "Programme",
        "Class Level",
        "Subject",
        "Chapter",
        "Topic",
        "Question Text",
        "Question Type",
        "Difficulty",
        "Marks",
        "Answer Text",
        "Solution Text",
        "Source",
      ],
      [
        "CBSE",
        "",
        "IX",
        "MATHEMATICS",
        "Real Numbers",
        "Euclid's Division Lemma",
        "Find the HCF of 240 and 180 using Euclid's division algorithm.",
        "short answer",
        "medium",
        "3",
        "60",
        "Using Euclid's algorithm: 240 = 180 × 1 + 60, 180 = 60 × 3 + 0. HCF = 60.",
        "NCERT Exemplar",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 20 },
      { wch: 24 },
      { wch: 50 },
      { wch: 18 },
      { wch: 12 },
      { wch: 8 },
      { wch: 30 },
      { wch: 40 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Questions");

    const arrayBuf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    return success({
      buffer: Buffer.from(arrayBuf),
      filename: "question-import-template.xlsx",
    });
  } catch (error) {
    console.error("generateQuestionTemplate error:", error);
    return failure("INTERNAL_ERROR", "Failed to generate template");
  }
}
