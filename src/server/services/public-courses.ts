import { db } from "../../lib/db";
import { Prisma } from "@prisma/client";

export interface PublicCourseTrack {
  id: string;
  displayName: string;
  classLevel: string;
  board: {
    id: string;
    code: string;
    name: string;
  };
  programme: {
    id: string;
    code: string;
    name: string;
  } | null;
  subject: {
    id: string;
    name: string;
  };
  batches: Array<{
    id: string;
    name: string;
    isActive: boolean;
    feePlan: {
      id: string;
      name: string;
      showPublicly: boolean;
      assignedTotalAmount: number | null;
    } | null;
  }>;
}

export interface PublicCoursesData {
  groups: Array<{
    board: {
      id: string;
      code: string;
      name: string;
    };
    programmes: Array<{
      programme: {
        id: string;
        code: string;
        name: string;
      } | null;
      tracks: PublicCourseTrack[];
    }>;
  }>;
}

export async function getPublicCourses(): Promise<PublicCoursesData> {
  const activeSession = await db.academicSession.findFirst({
    where: { isActive: true },
    select: { id: true },
  });

  if (!activeSession) {
    return { groups: [] };
  }

  // Fetch active curriculum tracks with their board, programme, subject, and batches
  const tracks = await db.curriculumTrack.findMany({
    where: {
      archivedAt: null,
      board: { archivedAt: null },
      programme: { archivedAt: null },
      subject: { archivedAt: null },
    },
    include: {
      board: { select: { id: true, code: true, name: true } },
      programme: { select: { id: true, code: true, name: true } },
      subject: { select: { id: true, name: true } },
      batches: {
        where: {
          academicSessionId: activeSession.id,
          archivedAt: null,
          isActive: true,
        },
        include: {
          feePlans: {
            where: {
              showPublicly: true,
              isActive: true,
              archivedAt: null,
              feeAssignments: {
                some: {
                  status: "ACTIVE",
                  archivedAt: null,
                },
              },
            },
            include: {
              feeAssignments: {
                where: {
                  status: "ACTIVE",
                  archivedAt: null,
                },
                include: {
                  feePlan: { select: { id: true, name: true, showPublicly: true } },
                },
                orderBy: { createdAt: "asc" },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: [
      { board: { code: "asc" } },
      { programme: { code: "asc" } },
      { classLevel: "asc" },
      { displayName: "asc" },
    ],
  });

  // Group by board, then programme (or null)
  const boardMap = new Map<
    string,
    {
      board: { id: string; code: string; name: string };
      programmeMap: Map<string | null, PublicCourseTrack[]>;
    }
  >();

  for (const track of tracks) {
    const boardKey = track.board.id;
    if (!boardMap.has(boardKey)) {
      boardMap.set(boardKey, {
        board: { id: track.board.id, code: track.board.code, name: track.board.name },
        programmeMap: new Map(),
      });
    }

    const boardData = boardMap.get(boardKey)!;
    const programmeKey = track.programmeId; // null if no programme
    if (!boardData.programmeMap.has(programmeKey)) {
      boardData.programmeMap.set(programmeKey, []);
    }

    const activeBatches = track.batches.filter((b) => b.isActive && !b.archivedAt);

    boardData.programmeMap.get(programmeKey)!.push({
      id: track.id,
      displayName: track.displayName,
      classLevel: track.classLevel,
      board: { id: track.board.id, code: track.board.code, name: track.board.name },
      programme: track.programme
        ? {
            id: track.programme.id,
            code: track.programme.code,
            name: track.programme.name,
          }
        : null,
      subject: { id: track.subject.id, name: track.subject.name },
      batches: activeBatches.map((b) => {
        const feePlan = b.feePlans?.[0];
        const feeAssignment = feePlan?.feeAssignments?.[0];
        return {
          id: b.id,
          name: b.name,
          isActive: b.isActive,
          feePlan: feeAssignment?.feePlan
            ? {
                id: feeAssignment.feePlan.id,
                name: feeAssignment.feePlan.name,
                showPublicly: feeAssignment.feePlan.showPublicly,
                assignedTotalAmount: Number(feeAssignment.assignedTotalAmount),
              }
            : null,
        };
      }),
    });
  }

  // Convert to array format
  const groups = Array.from(boardMap.entries()).map(([_, boardData]) => {
    const programmes = Array.from(boardData.programmeMap.entries()).map(
      ([_, tracks]) => ({
        programme: tracks[0]?.programme ?? null,
        tracks: tracks.sort(
          (a, b) =>
            a.classLevel.localeCompare(b.classLevel) ||
            a.displayName.localeCompare(b.displayName),
        ),
      }),
    );

    return {
      board: boardData.board,
      programmes: programmes.sort((a, b) => {
        const aCode = a.programme?.code ?? "ZZZ";
        const bCode = b.programme?.code ?? "ZZZ";
        return aCode.localeCompare(bCode);
      }),
    };
  });

  return { groups };
}
