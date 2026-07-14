import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/permissions";
import { ClassLevel, Role, StudyMaterialResourceType } from "@prisma/client";
import { listStudentMaterials } from "@/server/services/study-materials";
import { StudentMaterialList } from "@/features/materials/components/StudentMaterialList";
import {
  StudentMaterialFilters,
  type MaterialFilterOption,
} from "@/features/materials/components/StudentMaterialFilters";
import { DataListSearch } from "@/components/admin/data-list/DataListSearch";
import { DataListPagination } from "@/components/admin/data-list/DataListPagination";
import { DataListToolbar } from "@/components/layout/data-list-toolbar";
import { EmptyState } from "@/components/feedback/empty-state";
import { Library } from "lucide-react";
import { parseListParams } from "@/lib/url/search-params";
import { db } from "@/lib/db";

const CLASS_LEVELS: ClassLevel[] = ["IX", "X", "XI", "XII"];

const RESOURCE_TYPES: MaterialFilterOption[] = [
  { value: "DOCUMENT", label: "Document" },
  { value: "PRESENTATION", label: "Presentation" },
  { value: "IMAGE", label: "Image" },
  { value: "LINK", label: "Link" },
  { value: "TEXT", label: "Text" },
];

function firstString(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

function pickEnum<T extends string>(
  val: string | undefined,
  allowed: readonly T[],
): T | null {
  return val && (allowed as readonly string[]).includes(val) ? (val as T) : null;
}

export default async function StudentStudyMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolved = await searchParams;
  const appUser = await requireRole(Role.STUDENT);

  if (!appUser.studentId) {
    redirect("/unauthorized");
  }

  const listParams = parseListParams(resolved, ["publishedAt", "title"], "publishedAt");
  const classLevel = pickEnum<ClassLevel>(firstString(resolved.class), CLASS_LEVELS);
  const curriculumTrackId = firstString(resolved.subject) || null;
  const resourceType = pickEnum<StudyMaterialResourceType>(
    firstString(resolved.type),
    RESOURCE_TYPES.map((r) => r.value as StudyMaterialResourceType),
  );
  const sortRaw = firstString(resolved.sort);
  const sort: "publishedAt" | "title" = sortRaw === "title" ? "title" : "publishedAt";
  const direction = sort === "title" ? "asc" : "desc";

  const student = await db.student.findUnique({
    where: { id: appUser.studentId },
    include: {
      enrolments: {
        where: { status: "active", archivedAt: null },
        include: { curriculumTrack: { include: { subject: true } }, batch: true },
      },
    },
  });

  if (!student || student.enrolments.length === 0) {
    return (
      <EmptyState
        icon={Library}
        title="No Active Courses"
        description="You are not currently enrolled in any active courses."
      />
    );
  }

  const classOptions: MaterialFilterOption[] = [
    ...new Set(student.enrolments.map((e) => e.curriculumTrack.classLevel)),
  ].map((cl) => ({ value: cl, label: `Class ${cl}` }));

  const subjectOptions: MaterialFilterOption[] = [
    ...new Map(
      student.enrolments.map((e) => [
        e.curriculumTrackId,
        {
          value: e.curriculumTrackId,
          label:
            e.curriculumTrack.displayName ||
            `${e.curriculumTrack.subject.name} · ${e.curriculumTrack.classLevel}`,
        },
      ]),
    ).values(),
  ];

  const result = await listStudentMaterials(appUser.id, {
    page: listParams.page,
    pageSize: listParams.pageSize,
    q: listParams.query,
    classLevel,
    curriculumTrackId,
    resourceType,
    sort,
    direction,
  });

  if (!result.success) {
    if (result.error.code === "UNAUTHORIZED") {
      redirect("/unauthorized");
    }
    return (
      <EmptyState
        icon={Library}
        title="Error loading materials"
        description={result.error.message}
      />
    );
  }

  const { items, total, page, pageSize } = result.data;
  const isFiltered = Boolean(
    listParams.query || classLevel || curriculumTrackId || resourceType,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Study Materials</h1>
        <p className="text-muted-foreground">
          Notes, PDFs, and resources published for your courses.
        </p>
      </div>

      <DataListToolbar>
        <DataListSearch placeholder="Search materials..." />
        <StudentMaterialFilters
          classOptions={classOptions}
          subjectOptions={subjectOptions}
          resourceTypeOptions={RESOURCE_TYPES}
        />
      </DataListToolbar>

      {items.length === 0 ? (
        <EmptyState
          icon={Library}
          title={isFiltered ? "No matching materials" : "No Materials Yet"}
          description={
            isFiltered
              ? "Try adjusting your filters or search query."
              : "There are currently no study materials published for your courses."
          }
        />
      ) : (
        <>
          <StudentMaterialList items={items} />
          <DataListPagination currentPage={page} totalItems={total} pageSize={pageSize} />
        </>
      )}
    </div>
  );
}
