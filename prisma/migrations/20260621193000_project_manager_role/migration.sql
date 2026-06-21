ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PROJECT_MANAGER';

ALTER TABLE "Project"
ADD COLUMN IF NOT EXISTS "projectManagerId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'Project_projectManagerId_fkey'
      AND table_name = 'Project'
  ) THEN
    ALTER TABLE "Project"
    ADD CONSTRAINT "Project_projectManagerId_fkey"
    FOREIGN KEY ("projectManagerId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
