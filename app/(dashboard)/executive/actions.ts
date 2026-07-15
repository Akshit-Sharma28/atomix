"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/services/users/access.service";

const numberField = (minimum: number, maximum: number) =>
  z.coerce.number().min(minimum).max(maximum);

const settingsSchema = z.object({
  adoptionUsers: numberField(1, 10000).int(),
  hoursSavedPerUserPerDay: numberField(0, 24),
  dedicatedReviewsPerWeek: numberField(0, 10000).int(),
  augmentationReviewsPerWeek: numberField(0, 10000).int(),
  peerReviewsPerWeek: numberField(0, 10000).int(),
  retestsPerWeek: numberField(0, 10000).int(),
  lastWeekUsers: numberField(0, 10000).int(),
  lastWeekDedicatedReviews: numberField(0, 10000).int(),
  lastWeekAugmentationReviews: numberField(0, 10000).int(),
  lastWeekPeerReviews: numberField(0, 10000).int(),
  lastWeekRetests: numberField(0, 10000).int(),
  lastYearUsers: numberField(0, 10000).int(),
  lastYearDedicatedReviews: numberField(0, 10000).int(),
  lastYearAugmentationReviews: numberField(0, 10000).int(),
  lastYearPeerReviews: numberField(0, 10000).int(),
  lastYearRetests: numberField(0, 10000).int(),
  validatorHoursPerReview: numberField(0, 100),
  reviewerHoursPerReview: numberField(0, 100),
  peerReviewerHoursPerReview: numberField(0, 100),
  governanceHoursPerReview: numberField(0, 100),
  retesterHoursPerReview: numberField(0, 100),
  workdayHours: numberField(1, 24),
  workdaysPerWeek: numberField(1, 7).int(),
  workingWeeksPerYear: numberField(1, 52).int(),
  fteAnnualWorkingHours: numberField(1, 10000),
});

export type ProductivitySettingsActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function saveProductivitySettings(
  _previousState: ProductivitySettingsActionState,
  formData: FormData,
): Promise<ProductivitySettingsActionState> {
  const role = await requireAccess(["ADMIN", "EXECUTIVE"]);
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check the scenario values.",
    };
  }

  const values = parsed.data;
  const newReviewsPerWeek =
    values.dedicatedReviewsPerWeek + values.augmentationReviewsPerWeek;

  await prisma.executiveProductivitySetting.upsert({
    where: { id: "default" },
    update: {
      ...values,
      newReviewsPerWeek,
      dedicatedPoolShare:
        newReviewsPerWeek > 0 ? values.dedicatedReviewsPerWeek / newReviewsPerWeek : 0,
      retestRate: newReviewsPerWeek > 0 ? values.retestsPerWeek / newReviewsPerWeek : 0,
      updatedBy: role,
    },
    create: {
      id: "default",
      ...values,
      newReviewsPerWeek,
      dedicatedPoolShare:
        newReviewsPerWeek > 0 ? values.dedicatedReviewsPerWeek / newReviewsPerWeek : 0,
      retestRate: newReviewsPerWeek > 0 ? values.retestsPerWeek / newReviewsPerWeek : 0,
      updatedBy: role,
    },
  });

  revalidatePath("/executive");

  return {
    status: "success",
    message: "Scenario saved. All capacity KPIs have been recalculated.",
  };
}
