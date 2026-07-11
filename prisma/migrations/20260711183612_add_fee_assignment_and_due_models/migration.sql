-- CreateTable
CREATE TABLE "StudentFeeAssignment" (
    "id" TEXT NOT NULL,
    "enrolmentId" TEXT NOT NULL,
    "feePlanId" TEXT NOT NULL,
    "assignedTotalAmount" DECIMAL(10,2) NOT NULL,
    "startsOn" TIMESTAMP(3) NOT NULL,
    "endsOn" TIMESTAMP(3),
    "status" "FeeAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "StudentFeeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFeeDue" (
    "id" TEXT NOT NULL,
    "feeAssignmentId" TEXT NOT NULL,
    "feePlanInstallmentId" TEXT,
    "label" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amountDue" DECIMAL(10,2) NOT NULL,
    "amountWaived" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "FeeDueStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentFeeDue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentFeeAssignment_enrolmentId_idx" ON "StudentFeeAssignment"("enrolmentId");

-- CreateIndex
CREATE INDEX "StudentFeeAssignment_feePlanId_idx" ON "StudentFeeAssignment"("feePlanId");

-- CreateIndex
CREATE INDEX "StudentFeeAssignment_status_idx" ON "StudentFeeAssignment"("status");

-- CreateIndex
CREATE INDEX "StudentFeeDue_feeAssignmentId_idx" ON "StudentFeeDue"("feeAssignmentId");

-- CreateIndex
CREATE INDEX "StudentFeeDue_feePlanInstallmentId_idx" ON "StudentFeeDue"("feePlanInstallmentId");

-- CreateIndex
CREATE INDEX "StudentFeeDue_status_idx" ON "StudentFeeDue"("status");

-- CreateIndex
CREATE INDEX "StudentFeeDue_dueDate_idx" ON "StudentFeeDue"("dueDate");

-- AddForeignKey
ALTER TABLE "StudentFeeAssignment" ADD CONSTRAINT "StudentFeeAssignment_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "Enrolment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeAssignment" ADD CONSTRAINT "StudentFeeAssignment_feePlanId_fkey" FOREIGN KEY ("feePlanId") REFERENCES "FeePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeDue" ADD CONSTRAINT "StudentFeeDue_feeAssignmentId_fkey" FOREIGN KEY ("feeAssignmentId") REFERENCES "StudentFeeAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeDue" ADD CONSTRAINT "StudentFeeDue_feePlanInstallmentId_fkey" FOREIGN KEY ("feePlanInstallmentId") REFERENCES "FeePlanInstallment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create partial unique index for one active assignment per enrolment
-- This mirrors the project's existing partial-index pattern
CREATE UNIQUE INDEX "StudentFeeAssignment_enrolmentId_feePlanId_key" ON "StudentFeeAssignment" ("enrolmentId", "feePlanId") WHERE "archivedAt" IS NULL AND "status" = 'ACTIVE';
