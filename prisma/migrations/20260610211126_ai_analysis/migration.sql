-- CreateTable
CREATE TABLE "FindingAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "findingId" TEXT NOT NULL,
    "businessImpact" TEXT,
    "technicalImpact" TEXT,
    "remediationPlan" TEXT,
    "developerGuidance" TEXT,
    "executiveSummary" TEXT,
    CONSTRAINT "FindingAnalysis_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FindingAnalysis_findingId_key" ON "FindingAnalysis"("findingId");
