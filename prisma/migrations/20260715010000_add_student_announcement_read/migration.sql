-- CreateTable
CREATE TABLE "StudentAnnouncementRead" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentAnnouncementRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentAnnouncementRead_studentId_announcementId_key" ON "StudentAnnouncementRead"("studentId", "announcementId");

-- CreateIndex
CREATE INDEX "StudentAnnouncementRead_studentId_idx" ON "StudentAnnouncementRead"("studentId");

-- CreateIndex
CREATE INDEX "StudentAnnouncementRead_announcementId_idx" ON "StudentAnnouncementRead"("announcementId");

-- AddForeignKey
ALTER TABLE "StudentAnnouncementRead" ADD CONSTRAINT "StudentAnnouncementRead_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAnnouncementRead" ADD CONSTRAINT "StudentAnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
