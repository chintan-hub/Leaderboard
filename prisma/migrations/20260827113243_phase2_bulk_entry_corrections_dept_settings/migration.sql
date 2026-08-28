-- AlterTable
ALTER TABLE "ScoreTransaction" ADD COLUMN "batchId" TEXT;
ALTER TABLE "ScoreTransaction" ADD COLUMN "correctionTarget" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "scoringRule" TEXT NOT NULL DEFAULT 'NET_PRODUCTION',
    "rankingMetric" TEXT NOT NULL DEFAULT 'AVG_NET_PER_EMPLOYEE',
    "productionTrackingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reworkTrackingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Department" ("createdAt", "id", "isActive", "name", "rankingMetric", "scoringRule", "slug", "sortOrder") SELECT "createdAt", "id", "isActive", "name", "rankingMetric", "scoringRule", "slug", "sortOrder" FROM "Department";
DROP TABLE "Department";
ALTER TABLE "new_Department" RENAME TO "Department";
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");
CREATE UNIQUE INDEX "Department_slug_key" ON "Department"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ScoreTransaction_batchId_idx" ON "ScoreTransaction"("batchId");
