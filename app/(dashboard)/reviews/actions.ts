"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/services/users/access.service";

const statusOptions = new Set([
  "Requested",
  "Prerequisites Pending",
  "Ready for Review",
  "Assigned",
  "In Progress",
  "Peer Review",
  "Retest Requested",
  "Retest In Progress",
  "Completed",
  "Cancelled",
  "Blocked",
]);

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function updateReviewStatus(formData: FormData) {
  await requireAccess([
    "ADMIN",
    "GOVERNANCE_TEAM",
    "VALIDATOR",
    "QA_REVIEWER",
    "PROJECT_MANAGER",
    "ENGAGEMENT_MANAGER",
  ]);

  const reviewId = readString(formData, "reviewId");
  const status = readString(formData, "status");
  const notes = readString(formData, "notes");

  if (!reviewId || !statusOptions.has(status)) {
    throw new Error("Valid SR and status are required");
  }

  const review = await prisma.securityReview.findUnique({
    where: {
      id: reviewId,
    },
    select: {
      id: true,
      status: true,
      projectId: true,
    },
  });

  if (!review) {
    throw new Error("SR not found");
  }

  await prisma.securityReview.update({
    where: {
      id: reviewId,
    },
    data: {
      status,
      completedAt: status === "Completed" ? new Date() : null,
      cancelledAt: status === "Cancelled" ? new Date() : null,
    },
  });

  await prisma.reviewActivity.create({
    data: {
      reviewId,
      action: "Status Updated",
      actor: "Atomix Governance",
      oldValue: review.status,
      newValue: status,
      notes: notes || null,
    },
  });

  revalidatePath("/reviews");
  revalidatePath(`/reviews/${reviewId}`);
  revalidatePath(`/projects/${review.projectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/executive");
}
