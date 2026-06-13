import fs from "node:fs/promises";
import path from "node:path";
import sqlite3 from "sqlite3";

const dbPath =
  process.env.LOCAL_SQLITE_PATH ??
  path.join("prisma", "atomix.db");

const outputPath =
  process.env.ATOMIX_EXPORT_PATH ??
  "atomix-sqlite-export.json";

const tables = [
  "User",
  "Account",
  "Project",
  "Component",
  "ScopeProfile",
  "ScopeItem",
  "RequiredReviewType",
  "SecurityReview",
  "ReviewWorkstream",
  "ReviewerProfile",
  "ReviewerSkill",
  "ReviewerAssignment",
  "Finding",
  "FindingAnalysis",
  "FindingActivity",
  "Task",
  "RiskException",
  "RemediationPlan",
  "ReviewExtension",
  "ReviewCancellation",
  "ReviewActivity",
  "AppSession",
  "KnowledgeDocument",
  "CopilotConversation",
];

function all(db, sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

async function main() {
  await fs.access(dbPath);

  const db =
    new sqlite3.Database(dbPath);

  const exportData = {
    exportedAt: new Date().toISOString(),
    source: dbPath,
    tables: {},
  };

  for (const table of tables) {
    const exists =
      await all(
        db,
        `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`
      );

    if (exists.length === 0) {
      exportData.tables[table] = [];
      continue;
    }

    exportData.tables[table] =
      await all(db, `SELECT * FROM "${table}"`);
  }

  await fs.writeFile(
    outputPath,
    JSON.stringify(exportData, null, 2)
  );

  db.close();

  console.log(
    `Exported SQLite data from ${dbPath} to ${outputPath}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
