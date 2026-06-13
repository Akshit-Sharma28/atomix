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

    await delegate.createMany({
      data: rows.map(normalizeRow),
      skipDuplicates: true,
    });

    console.log(`Imported ${rows.length} ${tableName} rows`);
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
