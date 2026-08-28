/*
  Warnings:

  - You are about to drop the column `teeth` on the `ScoreTransaction` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ScoreTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "cases" INTEGER,
    "points" INTEGER,
    "responsibility" TEXT,
    "correctionTarget" TEXT,
    "reason" TEXT NOT NULL,
    "eventDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByAdminId" TEXT NOT NULL,
    "correctsTransactionId" TEXT,
    "batchId" TEXT,
    CONSTRAINT "ScoreTransaction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScoreTransaction_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScoreTransaction_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "Admin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScoreTransaction_correctsTransactionId_fkey" FOREIGN KEY ("correctsTransactionId") REFERENCES "ScoreTransaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ScoreTransaction" ("batchId", "correctionTarget", "correctsTransactionId", "createdAt", "createdByAdminId", "departmentId", "employeeId", "eventDate", "id", "points", "reason", "responsibility", "type") SELECT "batchId", "correctionTarget", "correctsTransactionId", "createdAt", "createdByAdminId", "departmentId", "employeeId", "eventDate", "id", "points", "reason", "responsibility", "type" FROM "ScoreTransaction";
DROP TABLE "ScoreTransaction";
ALTER TABLE "new_ScoreTransaction" RENAME TO "ScoreTransaction";
CREATE UNIQUE INDEX "ScoreTransaction_correctsTransactionId_key" ON "ScoreTransaction"("correctsTransactionId");
CREATE INDEX "ScoreTransaction_employeeId_idx" ON "ScoreTransaction"("employeeId");
CREATE INDEX "ScoreTransaction_departmentId_idx" ON "ScoreTransaction"("departmentId");
CREATE INDEX "ScoreTransaction_eventDate_idx" ON "ScoreTransaction"("eventDate");
CREATE INDEX "ScoreTransaction_batchId_idx" ON "ScoreTransaction"("batchId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
