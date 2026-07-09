import { requireAdmin } from "@/lib/auth/permissions";
import { listTeachers } from "@/server/services/teachers";
import { TeacherList } from "@/features/teachers/components/TeacherList";
import { Button } from "@/components/ui/button";
import { DataListSearch } from "@/components/admin/data-list/DataListSearch";
import { DataListPagination } from "@/components/admin/data-list/DataListPagination";
import { Plus } from "lucide-react";
import { TeacherFormDialog } from "@/features/teachers/components/TeacherFormDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    status?: string;
    page?: string;
    sort?: string;
    direction?: string;
  };
}) {
  await requireAdmin();

  const q = searchParams.q || "";
  const status = (searchParams.status as any) || "active";
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const sort = (searchParams.sort as any) || "displayName";
  const direction = (searchParams.direction as any) || "asc";

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
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground mt-1">
            Manage teacher profiles and access.
          </p>
        </div>
        <TeacherFormDialog
          mode="create"
          trigger={
            <Button>
              <Plus className="size-4 mr-2" />
              Add Teacher
            </Button>
          }
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <DataListSearch placeholder="Search teachers..." />

        {/* Simple status filter for now, ideally built as a generic component but this suffices */}
        <form className="w-full sm:w-auto" method="GET">
          {/* Preserve other query params */}
          <input type="hidden" name="q" value={q} />
          {searchParams.page && <input type="hidden" name="page" value="1" />}
          {searchParams.sort && (
            <input type="hidden" name="sort" value={searchParams.sort} />
          )}
          {searchParams.direction && (
            <input type="hidden" name="direction" value={searchParams.direction} />
          )}

          <Select
            name="status"
            defaultValue={status}
            onValueChange={(val) => {
              const url = new URL(window.location.href);
              url.searchParams.set("status", val);
              url.searchParams.set("page", "1");
              window.location.href = url.pathname + url.search;
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </form>
      </div>

      <TeacherList teachers={items} />

      <DataListPagination totalItems={total} pageSize={limit} currentPage={page} />
    </div>
  );
}
