CREATE TABLE "ExecutiveProductivitySetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "adoptionUsers" INTEGER NOT NULL DEFAULT 100,
    "hoursSavedPerUserPerDay" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "newReviewsPerWeek" INTEGER NOT NULL DEFAULT 25,
    "dedicatedPoolShare" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "retestRate" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "validatorHoursPerReview" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "reviewerHoursPerReview" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "peerReviewerHoursPerReview" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "governanceHoursPerReview" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "retesterHoursPerReview" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "workdayHours" DOUBLE PRECISION NOT NULL DEFAULT 9,
    "workdaysPerWeek" INTEGER NOT NULL DEFAULT 5,
    "workingWeeksPerYear" INTEGER NOT NULL DEFAULT 52,
    "fteAnnualWorkingHours" DOUBLE PRECISION NOT NULL DEFAULT 2025,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "ExecutiveProductivitySetting_pkey" PRIMARY KEY ("id")
);
