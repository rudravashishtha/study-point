import { requireAdmin } from "@/lib/auth/permissions";
import { listTeachers, type ListTeachersOptions } from "@/server/services/teachers";
import { TeacherList } from "@/features/teachers/components/TeacherList";
import { Button } from "@/components/ui/button";
import { DataListSearch } from "@/components/admin/data-list/DataListSearch";
import { DataListPagination } from "@/components/admin/data-list/DataListPagination";
import { Plus } from "lucide-react";
import { TeacherFormDialog } from "@/features/teachers/components/TeacherFormDialog";
import { TeacherStatusFilter } from "@/features/teachers/components/TeacherStatusFilter";
import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
  PageHeaderActions,
} from "@/components/layout/page-header";
import { DataListToolbar, DataListFilters } from "@/components/layout/data-list-toolbar";

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
    sort?: string;
    direction?: string;
  }>;
}) {
  await requireAdmin();
  const resolvedParams = await searchParams;

  const q = resolvedParams.q || "";
  const status = (resolvedParams.status as ListTeachersOptions["status"]) || "active";
  const page = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1;
  const sort = (resolvedParams.sort as ListTeachersOptions["sort"]) || "displayName";
  const direction =
    (resolvedParams.direction as ListTeachersOptions["direction"]) || "asc";

  const { items, total, limit } = await listTeachers({
    q,
    status,
    page,
    limit: 20,
    sort,
    direction,
  });

  return (
    <div className="space-y-6">
      <PageHeader>
        <div>
          <PageHeaderHeading>Teachers</PageHeaderHeading>
          <PageHeaderDescription>
            Manage teacher profiles and access.
          </PageHeaderDescription>
        </div>
        <PageHeaderActions>
          <TeacherFormDialog
            mode="create"
            trigger={
              <Button>
                <Plus className="size-4 mr-2" />
                Add Teacher
              </Button>
            }
          />
        </PageHeaderActions>
      </PageHeader>

      <DataListToolbar>
        <DataListSearch placeholder="Search teachers..." />
        <DataListFilters>
          <TeacherStatusFilter />
        </DataListFilters>
      </DataListToolbar>

      <TeacherList teachers={items} />

      <DataListPagination totalItems={total} pageSize={limit} currentPage={page} />
    </div>
  );
}
