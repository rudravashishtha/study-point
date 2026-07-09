import { z } from "zod";

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  pageSize: z.coerce.number().int().positive().max(100).catch(20),
});

export const ArchiveStateSchema = z.enum(["active", "archived", "all"]).catch("active");
export const SortDirectionSchema = z.enum(["asc", "desc"]).catch("asc");

function getFirstString(val: string | string[] | undefined): string | undefined {
  if (Array.isArray(val)) {
    return val[0];
  }
  return val;
}

export function parseListParams<SortField extends string>(
  searchParams: { [key: string]: string | string[] | undefined },
  allowedSortFields: readonly SortField[],
  defaultSortField: SortField,
) {
  const p = PaginationSchema.parse({
    page: getFirstString(searchParams.page),
    pageSize: getFirstString(searchParams.pageSize),
  });

  const archiveState = ArchiveStateSchema.parse(getFirstString(searchParams.archive));

  let sortField = defaultSortField;
  const rawSort = getFirstString(searchParams.sort);
  if (
    typeof rawSort === "string" &&
    (allowedSortFields as readonly string[]).includes(rawSort)
  ) {
    sortField = rawSort as SortField;
  }

  const sortDir = SortDirectionSchema.parse(getFirstString(searchParams.dir));

  const rawQuery = getFirstString(searchParams.q);
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";

  return {
    ...p,
    archiveState,
    sortField,
    sortDir,
    query,
  };
}
