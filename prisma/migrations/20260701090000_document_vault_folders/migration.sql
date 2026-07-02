ALTER TABLE "KnowledgeDocument" ADD COLUMN "folderName" TEXT NOT NULL DEFAULT 'General';

UPDATE "KnowledgeDocument"
SET "folderName" =
  COALESCE("sprId", 'Unassigned SPR') ||
  ' / ' ||
  COALESCE("srId", 'Unassigned SR') ||
  ' / Iteration ' ||
  "iteration";
