-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PRODUCTION_COMPLETED', 'PRODUCTION_REWORK', 'MANUAL_BONUS', 'MANUAL_DEDUCTION', 'CORRECTION');

-- CreateEnum
CREATE TYPE "ReworkResponsibility" AS ENUM ('DEPARTMENT_FAULT', 'EXTERNAL_NOT_FAULT');

-- CreateEnum
CREATE TYPE "CorrectionTarget" AS ENUM ('COMPLETED_CASES', 'CASES_RETURNED', 'CASES_RETURNED_EXTERNAL', 'MANUAL_BONUS', 'MANUAL_DEDUCTION');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "scoringRule" TEXT NOT NULL DEFAULT 'NET_PRODUCTION',
    "rankingMetric" TEXT NOT NULL DEFAULT 'AVG_NET_PER_EMPLOYEE',
    "productionTrackingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reworkTrackingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreTransaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "employeeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "cases" INTEGER,
    "points" INTEGER,
    "responsibility" "ReworkResponsibility",
    "correctionTarget" "CorrectionTarget",
    "reason" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByAdminId" TEXT NOT NULL,
    "correctsTransactionId" TEXT,
    "batchId" TEXT,

    CONSTRAINT "ScoreTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_slug_key" ON "Department"("slug");

-- CreateIndex
CREATE INDEX "Employee_departmentId_idx" ON "Employee"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreTransaction_correctsTransactionId_key" ON "ScoreTransaction"("correctsTransactionId");

-- CreateIndex
CREATE INDEX "ScoreTransaction_employeeId_idx" ON "ScoreTransaction"("employeeId");

-- CreateIndex
CREATE INDEX "ScoreTransaction_departmentId_idx" ON "ScoreTransaction"("departmentId");

-- CreateIndex
CREATE INDEX "ScoreTransaction_eventDate_idx" ON "ScoreTransaction"("eventDate");

-- CreateIndex
CREATE INDEX "ScoreTransaction_batchId_idx" ON "ScoreTransaction"("batchId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreTransaction" ADD CONSTRAINT "ScoreTransaction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreTransaction" ADD CONSTRAINT "ScoreTransaction_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreTransaction" ADD CONSTRAINT "ScoreTransaction_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreTransaction" ADD CONSTRAINT "ScoreTransaction_correctsTransactionId_fkey" FOREIGN KEY ("correctsTransactionId") REFERENCES "ScoreTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
