import fs from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const inputPath =
  process.env.ATOMIX_EXPORT_PATH ??
  "atomix-sqlite-export.json";

const prisma = new PrismaClient();

const importOrder = [
  ["User", "user"],
  ["Account", "account"],
  ["Project", "project"],
  ["Component", "component"],
  ["ScopeProfile", "scopeProfile"],
  ["ScopeItem", "scopeItem"],
  ["RequiredReviewType", "requiredReviewType"],
  ["SecurityReview", "securityReview"],
  ["ReviewWorkstream", "reviewWorkstream"],
  ["ReviewerProfile", "reviewerProfile"],
  ["ReviewerSkill", "reviewerSkill"],
  ["ReviewerAssignment", "reviewerAssignment"],
  ["Finding", "finding"],
  ["FindingAnalysis", "findingAnalysis"],
  ["FindingActivity", "findingActivity"],
  ["Task", "task"],
  ["RiskException", "riskException"],
  ["RemediationPlan", "remediationPlan"],
  ["ReviewExtension", "reviewExtension"],
  ["ReviewCancellation", "reviewCancellation"],
  ["ReviewActivity", "reviewActivity"],
  ["AppSession", "appSession"],
  ["KnowledgeDocument", "knowledgeDocument"],
  ["CopilotConversation", "copilotConversation"],
];

const childTableForeignKeys = {
  Account: [["user", "userId"]],
  Component: [["project", "projectId"]],
  ScopeProfile: [["project", "projectId"]],
  ScopeItem: [
    ["scopeProfile", "scopeProfileId"],
    ["component", "componentId", true],
  ],
  RequiredReviewType: [["scopeProfile", "scopeProfileId"]],
  SecurityReview: [
    ["project", "projectId"],
    ["scopeProfile", "scopeProfileId", true],
  ],
  ReviewWorkstream: [["securityReview", "reviewId"]],
  ReviewerProfile: [["user", "userId"]],
  ReviewerSkill: [["reviewerProfile", "reviewerProfileId"]],
  ReviewerAssignment: [
    ["securityReview", "reviewId"],
    ["reviewWorkstream", "workstreamId", true],
    ["reviewerProfile", "reviewerProfileId", true],
    ["user", "userId", true],
  ],
  Finding: [
    ["project", "projectId"],
    ["securityReview", "reviewId", true],
    ["component", "componentId", true],
    ["finding", "canonicalFindingId", true],
  ],
  FindingAnalysis: [["finding", "findingId"]],
  FindingActivity: [["finding", "findingId"]],
  Task: [
    ["project", "projectId"],
    ["finding", "findingId", true],
    ["remediationPlan", "remediationPlanId", true],
    ["user", "ownerId", true],
  ],
  RiskException: [["finding", "findingId"]],
  RemediationPlan: [
    ["finding", "findingId"],
    ["user", "ownerId", true],
  ],
  ReviewExtension: [
    ["securityReview", "reviewId"],
    ["securityReview", "relatedReviewId", true],
  ],
  ReviewCancellation: [["securityReview", "reviewId"]],
  ReviewActivity: [["securityReview", "reviewId"]],
  AppSession: [["user", "currentUserId"]],
};

const dateFields = new Set([
  "createdAt",
  "updatedAt",
  "dueDate",
  "requestedStartDate",
  "actualStartDate",
  "completedAt",
  "cancelledAt",
  "assignedAt",
  "acceptedAt",
  "startedAt",
  "endDate",
  "startDate",
  "targetDate",
  "expiresAt",
  "requestedUntil",
]);

const booleanFields = new Set([
  "isActive",
  "verified",
  "internetFacing",
  "authRequired",
  "inScope",
  "required",
]);

function normalizeRow(row) {
  const normalized = {};

  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined) {
      normalized[key] = null;
      continue;
    }

    if (dateFields.has(key)) {
      normalized[key] = new Date(value);
      continue;
    }

    if (booleanFields.has(key)) {
      normalized[key] =
        value === true ||
        value === 1 ||
        value === "1";
      continue;
    }

    normalized[key] = value;
  }

  return normalized;
}

async function existingIds(delegateName) {
  const rows =
    await prisma[delegateName].findMany({
      select: {
        id: true,
      },
    });

  return new Set(rows.map((row) => row.id));
}

async function filterRowsForExistingParents(
  tableName,
  rows
) {
  const foreignKeys =
    childTableForeignKeys[tableName] ?? [];

  if (foreignKeys.length === 0) {
    return rows;
  }

  const idSets = new Map();

  for (const [delegateName] of foreignKeys) {
    if (!idSets.has(delegateName)) {
      idSets.set(
        delegateName,
        await existingIds(delegateName)
      );
    }
  }

  const filtered = rows.filter((row) =>
    foreignKeys.every(
      ([delegateName, fieldName, optional]) => {
        const value = row[fieldName];

        if (
          optional &&
          (value === null || value === undefined)
        ) {
          return true;
        }

        return idSets
          .get(delegateName)
          .has(value);
      }
    )
  );

  const skipped = rows.length - filtered.length;

  if (skipped > 0) {
    console.log(
      `Skipped ${skipped} ${tableName} rows with missing parent records`
    );
  }

  return filtered;
}

async function main() {
  if (!process.env.DATABASE_URL?.startsWith("postgres")) {
    throw new Error(
      "DATABASE_URL must point to Neon/Postgres before importing."
    );
  }

  const file =
    await fs.readFile(inputPath, "utf8");
  const exportData = JSON.parse(file);

  for (const [tableName, delegateName] of importOrder) {
    const rows =
      exportData.tables?.[tableName] ?? [];

    if (rows.length === 0) {
      console.log(`Skipped ${tableName}: 0 rows`);
      continue;
    }

    const delegate = prisma[delegateName];

    if (!delegate) {
      console.log(`Skipped ${tableName}: delegate not found`);
      continue;
    }

    const filteredRows =
      await filterRowsForExistingParents(
        tableName,
        rows
      );

    if (filteredRows.length === 0) {
      console.log(
        `Skipped ${tableName}: 0 importable rows`
      );
      continue;
    }

    await delegate.createMany({
      data: filteredRows.map(normalizeRow),
      skipDuplicates: true,
    });

    console.log(`Imported ${filteredRows.length} ${tableName} rows`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
