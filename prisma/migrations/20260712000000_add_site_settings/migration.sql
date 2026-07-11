-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL,
    "instituteName" TEXT NOT NULL,
    "tagline" TEXT,
    "phone" TEXT,
    "whatsappNumber" TEXT,
    "email" TEXT,
    "address" TEXT,
    "landmark" TEXT,
    "mapUrl" TEXT,
    "openingHours" TEXT,
    "logoFileId" TEXT,
    "faviconFileId" TEXT,
    "defaultTitle" TEXT,
    "defaultDescription" TEXT,
    "ogImageFileId" TEXT,
    "socialLinks" JSONB,
    "heroHeadline" TEXT,
    "heroSubheadline" TEXT,
    "heroCtaText" TEXT,
    "heroCtaTarget" TEXT,
    "feeDisplayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteSettings_id_idx" ON "SiteSettings"("id");