-- CreateEnum
CREATE TYPE "FileAssetStorageAccessClass" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "FileAssetLifecycleState" AS ENUM ('PENDING', 'ACTIVE', 'ARCHIVED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "FileUploadUsageCategory" AS ENUM ('STUDY_MATERIAL');

-- CreateEnum
CREATE TYPE "FileUploadScope" AS ENUM ('BATCH', 'CURRICULUM_TRACK');

-- CreateEnum
CREATE TYPE "StudyMaterialResourceType" AS ENUM ('DOCUMENT', 'PRESENTATION', 'IMAGE', 'LINK', 'TEXT');

-- CreateEnum
CREATE TYPE "StudyMaterialVisibility" AS ENUM ('CURRICULUM_TRACK', 'BATCH');

-- CreateEnum
CREATE TYPE "StudyMaterialLifecycleState" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');


-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageAccessClass" "FileAssetStorageAccessClass" NOT NULL,
    "lifecycleState" "FileAssetLifecycleState" NOT NULL,
    "usageCategory" "FileUploadUsageCategory" NOT NULL,
    "uploadScope" "FileUploadScope" NOT NULL,
    "targetBatchId" TEXT,
    "targetSessionId" TEXT,
    "targetTrackId" TEXT,
    "storageDeletedAt" TIMESTAMP(3),
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyMaterial" (
    "id" TEXT NOT NULL,
    "academicSessionId" TEXT NOT NULL,
    "curriculumTrackId" TEXT NOT NULL,
    "batchId" TEXT,
    "chapterId" TEXT,
    "topicId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "resourceType" "StudyMaterialResourceType" NOT NULL,
    "fileAssetId" TEXT,
    "externalLinkUrl" TEXT,
    "textContent" TEXT,
    "visibility" "StudyMaterialVisibility" NOT NULL,
    "lifecycleState" "StudyMaterialLifecycleState" NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "archivedBy" TEXT,

    CONSTRAINT "StudyMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FileAsset_storageKey_key" ON "FileAsset"("storageKey");

-- CreateIndex
CREATE INDEX "StudyMaterial_academicSessionId_curriculumTrackId_visibilit_idx" ON "StudyMaterial"("academicSessionId", "curriculumTrackId", "visibility", "lifecycleState");

-- CreateIndex
CREATE INDEX "StudyMaterial_batchId_lifecycleState_idx" ON "StudyMaterial"("batchId", "lifecycleState");

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_targetBatchId_fkey" FOREIGN KEY ("targetBatchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_targetSessionId_fkey" FOREIGN KEY ("targetSessionId") REFERENCES "AcademicSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_targetTrackId_fkey" FOREIGN KEY ("targetTrackId") REFERENCES "CurriculumTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyMaterial" ADD CONSTRAINT "StudyMaterial_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyMaterial" ADD CONSTRAINT "StudyMaterial_curriculumTrackId_fkey" FOREIGN KEY ("curriculumTrackId") REFERENCES "CurriculumTrack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyMaterial" ADD CONSTRAINT "StudyMaterial_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyMaterial" ADD CONSTRAINT "StudyMaterial_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyMaterial" ADD CONSTRAINT "StudyMaterial_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyMaterial" ADD CONSTRAINT "StudyMaterial_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
