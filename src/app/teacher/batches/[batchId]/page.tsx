import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/permissions";
import { getTeacherContext } from "@/server/auth/teacher";
import { getBatchById } from "@/server/services/batches";
import { listChapters } from "@/server/services/curriculum/chapters";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, AlertCircle, ClipboardCheck } from "lucide-react";
import { TeacherMaterialList } from "@/features/materials/components/TeacherMaterialList";
import {
  TeacherHomeworkList,
  type TeacherHomeworkItem,
} from "@/features/homework/components/TeacherHomeworkList";

export default async function TeacherBatchDetailPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  await requireAuth();

  const { batchId } = await params;

  const context = await getTeacherContext(batchId);
  if (!context.isAuthorized) {
    redirect("/unauthorized");
  }

  const batch = await getBatchById(batchId);
  if (!batch) {
    notFound();
  }

  // Find the track and chapters
  const chapters = await listChapters(batch.curriculumTrackId, {
    archiveState: "active",
  });

  // Fetch only BATCH scoped materials for this batch
  const materials = await db.studyMaterial.findMany({
    where: {
      visibility: "BATCH",
      batchId: batchId,
    },
    orderBy: { createdAt: "desc" },
    include: { fileAsset: true },
  });

  // Fetch homework for this batch
  const homeworkRecords = await db.homework.findMany({
    where: { batchId },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      chapter: true,
      topic: true,
      fileAsset: true,
    },
  });

  const homework: TeacherHomeworkItem[] = homeworkRecords.map((h) => ({
    id: h.id,
    title: h.title,
    description: h.description,
    lifecycleState: h.lifecycleState,
    batchId: h.batchId,
    assignedDate: h.assignedDate,
    dueDate: h.dueDate.toISOString(),
    fileAssetId: h.fileAssetId,
    chapterId: h.chapterId,
    topicId: h.topicId,
    chapter: h.chapter ? { name: h.chapter.name } : null,
    topic: h.topic ? { name: h.topic.name } : null,
  }));

  const canManageMaterials = context.effectivePermissions.includes("MATERIALS_MANAGE");
  const canManageHomework = context.effectivePermissions.includes("HOMEWORK_MANAGE");

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{batch.name}</h1>
          <Badge className="bg-green-500/10 text-green-700">Teacher Portal</Badge>
          {batch.archivedAt && <Badge variant="destructive">Archived</Badge>}
          {!batch.archivedAt && !batch.isActive && (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-1">
          {batch.academicSession.name} •{" "}
          {batch.curriculumTrack.displayName ||
            `${batch.curriculumTrack.subject.name} - Class ${batch.curriculumTrack.classLevel}`}
        </p>
      </div>

      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="materials" className="gap-2">
            <BookOpen className="size-4" />
            Study Materials
          </TabsTrigger>
          <TabsTrigger value="homework" className="gap-2">
            <ClipboardCheck className="size-4" />
            Homework
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="materials"
          className="mt-0 border rounded-md p-6 bg-card text-card-foreground shadow-sm"
        >
          {batch.archivedAt && (
            <div className="mb-6 p-4 bg-red-50 text-red-900 rounded-md flex items-start gap-3">
              <AlertCircle className="size-5 mt-0.5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">This batch is archived</p>
                <p className="text-sm mt-1 text-red-700">
                  Materials can be viewed, but all mutation controls are disabled.
                </p>
              </div>
            </div>
          )}

          <TeacherMaterialList
            materials={materials}
            chapters={chapters}
            batchId={batchId}
            canManage={canManageMaterials && !batch.archivedAt}
          />
        </TabsContent>

        <TabsContent
          value="homework"
          className="mt-0 border rounded-md p-6 bg-card text-card-foreground shadow-sm"
        >
          {batch.archivedAt && (
            <div className="mb-6 p-4 bg-red-50 text-red-900 rounded-md flex items-start gap-3">
              <AlertCircle className="size-5 mt-0.5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">This batch is archived</p>
                <p className="text-sm mt-1 text-red-700">
                  Homework can be viewed, but all mutation controls are disabled.
                </p>
              </div>
            </div>
          )}

          <TeacherHomeworkList
            homework={homework}
            chapters={chapters}
            batchId={batchId}
            canManage={canManageHomework && !batch.archivedAt}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
