export function getAvailableTeachersForBatch<T extends { id: string; active?: boolean }>(
  allActiveTeachers: T[],
  batchAssignments: { teacherId: string; archivedAt: Date | null }[],
): T[] {
  const activeAssignments = batchAssignments.filter((a) => !a.archivedAt);
  return allActiveTeachers.filter(
    (teacher) =>
      teacher.active !== false &&
      !activeAssignments.some((a) => a.teacherId === teacher.id),
  );
}
