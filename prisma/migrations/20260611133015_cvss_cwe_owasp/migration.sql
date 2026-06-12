-- AlterTable
ALTER TABLE "Finding" ADD COLUMN "cvssScore" REAL;
ALTER TABLE "Finding" ADD COLUMN "cvssVector" TEXT;
ALTER TABLE "Finding" ADD COLUMN "cweId" TEXT;
ALTER TABLE "Finding" ADD COLUMN "owaspCategory" TEXT;
