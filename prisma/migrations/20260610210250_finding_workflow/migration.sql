/*
  Warnings:

  - You are about to drop the column `cvss` on the `Finding` table. All the data in the column will be lost.
  - You are about to drop the column `cwe` on the `Finding` table. All the data in the column will be lost.
  - You are about to drop the column `riskScore` on the `Finding` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Finding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "owner" TEXT,
    "dueDate" DATETIME,
    "description" TEXT,
    "remediation" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Finding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Finding" ("createdAt", "description", "dueDate", "id", "owner", "projectId", "remediation", "severity", "source", "status", "title", "verified") SELECT "createdAt", "description", "dueDate", "id", "owner", "projectId", "remediation", "severity", "source", "status", "title", "verified" FROM "Finding";
DROP TABLE "Finding";
ALTER TABLE "new_Finding" RENAME TO "Finding";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
