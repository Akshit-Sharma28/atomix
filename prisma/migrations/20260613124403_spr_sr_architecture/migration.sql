-- CreateTable
CREATE TABLE "Component" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'APPLICATION',
    "description" TEXT,
    "criticality" TEXT NOT NULL DEFAULT 'Medium',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Component_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Component_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Component" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScopeProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "riskProfile" TEXT,
    "businessCriticality" TEXT,
    "dataClassification" TEXT,
    "internetFacing" BOOLEAN NOT NULL DEFAULT false,
    "authRequired" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScopeProfile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScopeItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scopeProfileId" TEXT NOT NULL,
    "componentId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'URL',
    "value" TEXT,
    "inScope" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    CONSTRAINT "ScopeItem_scopeProfileId_fkey" FOREIGN KEY ("scopeProfileId") REFERENCES "ScopeProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScopeItem_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RequiredReviewType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scopeProfileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    CONSTRAINT "RequiredReviewType_scopeProfileId_fkey" FOREIGN KEY ("scopeProfileId") REFERENCES "ScopeProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SecurityReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "srId" TEXT,
    "projectId" TEXT NOT NULL,
    "scopeProfileId" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PENTEST',
    "status" TEXT NOT NULL DEFAULT 'Requested',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "requestedStartDate" DATETIME,
    "actualStartDate" DATETIME,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "cancelledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SecurityReview_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SecurityReview_scopeProfileId_fkey" FOREIGN KEY ("scopeProfileId") REFERENCES "ScopeProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewWorkstream" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Not Started',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReviewWorkstream_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "SecurityReview" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "availability" TEXT NOT NULL DEFAULT 'Available',
    "weeklyCapacityHours" INTEGER NOT NULL DEFAULT 20,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReviewerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewerSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewerProfileId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'Intermediate',
    CONSTRAINT "ReviewerSkill_reviewerProfileId_fkey" FOREIGN KEY ("reviewerProfileId") REFERENCES "ReviewerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewerAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewId" TEXT NOT NULL,
    "workstreamId" TEXT,
    "reviewerProfileId" TEXT,
    "userId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'Primary',
    "status" TEXT NOT NULL DEFAULT 'Assigned',
    "allocatedHours" INTEGER,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReviewerAssignment_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "SecurityReview" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReviewerAssignment_workstreamId_fkey" FOREIGN KEY ("workstreamId") REFERENCES "ReviewWorkstream" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReviewerAssignment_reviewerProfileId_fkey" FOREIGN KEY ("reviewerProfileId") REFERENCES "ReviewerProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReviewerAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewExtension" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewId" TEXT NOT NULL,
    "relatedReviewId" TEXT,
    "requestedUntil" DATETIME NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Requested',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReviewExtension_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "SecurityReview" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReviewExtension_relatedReviewId_fkey" FOREIGN KEY ("relatedReviewId") REFERENCES "SecurityReview" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewCancellation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Requested',
    "approvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReviewCancellation_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "SecurityReview" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewActivity_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "SecurityReview" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiskException" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "findingId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Requested',
    "expiresAt" DATETIME,
    "approvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RiskException_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RemediationPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "findingId" TEXT NOT NULL,
    "ownerId" TEXT,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Planned',
    "targetDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RemediationPlan_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RemediationPlan_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Finding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "ownerId" TEXT,
    "dueDate" DATETIME,
    "slaDays" INTEGER,
    "description" TEXT,
    "remediation" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "cvssScore" REAL,
    "cvssVector" TEXT,
    "cweId" TEXT,
    "owaspCategory" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "reviewId" TEXT,
    "componentId" TEXT,
    "canonicalFindingId" TEXT,
    CONSTRAINT "Finding_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Finding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Finding_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "SecurityReview" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Finding_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Finding_canonicalFindingId_fkey" FOREIGN KEY ("canonicalFindingId") REFERENCES "Finding" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Finding" ("createdAt", "cvssScore", "cvssVector", "cweId", "description", "dueDate", "id", "owaspCategory", "ownerId", "projectId", "remediation", "severity", "slaDays", "source", "status", "title", "verified") SELECT "createdAt", "cvssScore", "cvssVector", "cweId", "description", "dueDate", "id", "owaspCategory", "ownerId", "projectId", "remediation", "severity", "slaDays", "source", "status", "title", "verified" FROM "Finding";
DROP TABLE "Finding";
ALTER TABLE "new_Finding" RENAME TO "Finding";
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sprId" TEXT,
    "name" TEXT NOT NULL,
    "client" TEXT,
    "executiveSummary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "riskTier" TEXT,
    "businessOwner" TEXT,
    "technicalOwner" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Project" ("client", "createdAt", "executiveSummary", "id", "name", "status") SELECT "client", "createdAt", "executiveSummary", "id", "name", "status" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_sprId_key" ON "Project"("sprId");
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "dueDate" DATETIME,
    "projectId" TEXT NOT NULL,
    "findingId" TEXT,
    "remediationPlanId" TEXT,
    "ownerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_remediationPlanId_fkey" FOREIGN KEY ("remediationPlanId") REFERENCES "RemediationPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("createdAt", "dueDate", "id", "projectId", "status", "title") SELECT "createdAt", "dueDate", "id", "projectId", "status", "title" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SecurityReview_srId_key" ON "SecurityReview"("srId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewerProfile_userId_key" ON "ReviewerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewerSkill_reviewerProfileId_skill_key" ON "ReviewerSkill"("reviewerProfileId", "skill");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewCancellation_reviewId_key" ON "ReviewCancellation"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "RemediationPlan_findingId_key" ON "RemediationPlan"("findingId");
