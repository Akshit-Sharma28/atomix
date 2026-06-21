"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/services/users/access.service";

function optionalDate(value: FormDataEntryValue | null) {
  if (!value || typeof value !== "string") {
    return undefined;
  }

  return value ? new Date(value) : undefined;
}

export async function createReviewerProfile(formData: FormData) {
  await requireAccess(["ADMIN", "GOVERNANCE_TEAM"]);

  const userId = String(formData.get("userId") ?? "");
  const availability = String(
    formData.get("availability") ?? "Available",
  );
  const weeklyCapacityHours = Number(
    formData.get("weeklyCapacityHours") ?? 20,
  );
  const notes = String(formData.get("notes") ?? "");

  if (!userId) {
    throw new Error("User is required");
  }

  await prisma.reviewerProfile.upsert({
    where: {
      userId,
    },
    update: {
      availability,
      weeklyCapacityHours,
      notes,
    },
    create: {
      userId,
      availability,
      weeklyCapacityHours,
      notes,
    },
  });

  revalidatePath("/workflow");
  revalidatePath("/reviewers");
}

export async function createSecurityReview(formData: FormData) {
  await requireAccess(["ADMIN", "GOVERNANCE_TEAM"]);

  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "");
  const type = String(formData.get("type") ?? "PENTEST");
  const priority = String(formData.get("priority") ?? "Medium");
  const requestedStartDate = optionalDate(
    formData.get("requestedStartDate"),
  );
  const dueDate = optionalDate(formData.get("dueDate"));

  if (!projectId || !title) {
    throw new Error("Project and title are required");
  }

  const count = await prisma.securityReview.count({
    where: {
      projectId,
    },
  });

  await prisma.securityReview.create({
    data: {
      projectId,
      title,
      type,
      priority,
      status: "Requested",
      srId: `SR-${new Date().getFullYear()}-${String(
        count + 1,
      ).padStart(4, "0")}`,
      requestedStartDate,
      dueDate,
    },
  });

  revalidatePath("/workflow");
  revalidatePath("/reviewers");
  revalidatePath("/executive");
}

export async function assignReviewToReviewer(formData: FormData) {
  await requireAccess(["ADMIN", "GOVERNANCE_TEAM"]);

  const reviewId = String(formData.get("reviewId") ?? "");
  const reviewerProfileId = String(
    formData.get("reviewerProfileId") ?? "",
  );
  const role = String(formData.get("role") ?? "Reviewer");
  const allocatedHours = Number(formData.get("allocatedHours") ?? 8);

  if (!reviewId || !reviewerProfileId) {
    throw new Error("Review and reviewer are required");
  }

  const reviewerProfile =
    await prisma.reviewerProfile.findUnique({
      where: {
        id: reviewerProfileId,
      },
      select: {
        id: true,
        userId: true,
      },
    });

  if (!reviewerProfile) {
    throw new Error("Reviewer profile not found");
  }

  await prisma.reviewerAssignment.create({
    data: {
      reviewId,
      reviewerProfileId,
      userId: reviewerProfile.userId,
      role,
      status: "Assigned",
      allocatedHours,
      startDate: new Date(),
    },
  });

  await prisma.securityReview.update({
    where: {
      id: reviewId,
    },
    data: {
      status: "Assigned",
    },
  });

  revalidatePath("/workflow");
  revalidatePath("/reviewers");
  revalidatePath("/executive");
}
