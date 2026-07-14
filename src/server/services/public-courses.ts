import { db } from "../../lib/db";

interface PublicCourseTrack {
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
      tracks: Array<{
        id: string;
        displayName: string;
        classLevel: string;
        board: { id: string; code: string; name: string };
        programme: { id: string; code: string; name: string } | null;
        subject: { id: string; name: string };
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
      }>;
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

  // Fetch tracks with basic includes
  const tracks = await db.curriculumTrack.findMany({
    where: {
      archivedAt: null,
      board: { archivedAt: null },
      programme: { archivedAt: null },
      subject: { archivedAt: null },
    },
    select: {
      id: true,
      displayName: true,
      classLevel: true,
      boardId: true,
      programmeId: true,
      subjectId: true,
      board: { select: { id: true, code: true, name: true } },
      programme: { select: { id: true, code: true, name: true } },
      subject: { select: { id: true, name: true } },
    },
  });

  // Collect all track IDs for batch query
  const trackIds = tracks.map((t) => t.id);

  // Fetch active batches for these tracks in the current session
  const batches = await db.batch.findMany({
    where: {
      curriculumTrackId: { in: trackIds },
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
  });

  // Build batch map by curriculumTrackId
  const batchesByTrackId = new Map<string, typeof batches>();
  for (const batch of batches) {
    const trackId = batch.curriculumTrackId;
    if (!batchesByTrackId.has(trackId)) {
      batchesByTrackId.set(trackId, []);
    }
    batchesByTrackId.get(trackId)!.push(batch);
  }

  // Prepare track data with batches
  const tracksWithBatches = tracks.map((track) => {
    const trackBatches = batchesByTrackId.get(track.id) || [];
    return {
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
      batches: trackBatches.map((b) => {
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
    };
  });

  // Group by board, then programme (or null)
  const boardMap = new Map<
    string,
    {
      board: { id: string; code: string; name: string };
      programmeMap: Map<string | null, PublicCourseTrack[]>;
    }
  >();

  for (const track of tracksWithBatches) {
    const boardKey = track.board.id;
    if (!boardMap.has(boardKey)) {
      boardMap.set(boardKey, {
        board: { id: track.board.id, code: track.board.code, name: track.board.name },
        programmeMap: new Map(),
      });
    }

    const boardData = boardMap.get(boardKey)!;
    const programmeKey = track.programme?.id ?? null;
    if (!boardData.programmeMap.has(programmeKey)) {
      boardData.programmeMap.set(programmeKey, []);
    }

    boardData.programmeMap.get(programmeKey)!.push(track);
  }

  // Convert to array format
  const groups = Array.from(boardMap.entries()).map(([, boardData]) => {
    const programmes = Array.from(boardData.programmeMap.entries()).map(
      ([, trackItems]) => {
        return {
          programme: trackItems[0]?.programme ?? null,
          tracks: trackItems.sort(
            (a, b) =>
              a.classLevel.localeCompare(b.classLevel) ||
              a.displayName.localeCompare(b.displayName),
          ),
        };
      },
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
