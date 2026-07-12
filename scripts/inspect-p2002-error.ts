import { initializeTestDb, teardownTestDb } from "../src/lib/test/db-isolation";

async function run() {
  const testDb = await initializeTestDb();
  if (!testDb) return;

  try {
    const board = await testDb.board.create({ data: { code: "TEST_B", name: "B" } });
    const subject = await testDb.subject.create({ data: { code: "TEST_S", name: "S" } });

    await testDb.curriculumTrack.create({
      data: {
        boardId: board.id,
        subjectId: subject.id,
        classLevel: "IX",
        displayName: "T1",
      },
    });

    await testDb.curriculumTrack.create({
      data: {
        boardId: board.id,
        subjectId: subject.id,
        classLevel: "IX",
        displayName: "T2",
      },
    });
  } catch (err: unknown) {
    const e = err as {
      message?: string;
      meta?: {
        driverAdapterError?: {
          cause?: {
            originalMessage?: string;
          };
        };
      };
    };
    console.log("P2002 ERROR CAUSE:", e.meta?.driverAdapterError?.cause);
    console.log(
      "P2002 ERROR ORIGINAL MSG:",
      e.meta?.driverAdapterError?.cause?.originalMessage || e.message,
    );
  } finally {
    await testDb.curriculumTrack.deleteMany({});
    await testDb.subject.deleteMany({ where: { code: "TEST_S" } });
    await testDb.board.deleteMany({ where: { code: "TEST_B" } });
    await teardownTestDb();
  }
}

run();
