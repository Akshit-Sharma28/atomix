"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/services/users/access.service";
import type { Prisma } from "@prisma/client";

function optionalDate(value: FormDataEntryValue | null) {
  if (!value || typeof value !== "string") {
    return undefined;
  }

  return value ? new Date(value) : undefined;
}

function dateFromDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function extensionTarget(formData: FormData) {
  const customDate = optionalDate(formData.get("newDueDate"));

  if (customDate) {
    return customDate;
  }

  const extensionDays = Number(formData.get("extensionDays") ?? 7);
  return dateFromDays(Number.isFinite(extensionDays) ? extensionDays : 7);
}

export async function updateWeeklyGovernanceCall(formData: FormData) {
  await requireAccess(["ADMIN", "GOVERNANCE_TEAM"]);

  const reviewId = String(formData.get("reviewId") ?? "");
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const callStatus = String(formData.get("callStatus") ?? "In Progress");
  const notes = String(formData.get("notes") ?? "").trim();
  const newDueDate = optionalDate(formData.get("newDueDate"));

  if (!reviewId) {
    throw new Error("Review is required");
  }

  const review = await prisma.securityReview.findUnique({
    where: {
      id: reviewId,
    },
    include: {
      cancellation: true,
    },
  });

  if (!review) {
    throw new Error("Review not found");
  }

  const assignmentUpdate =
    assignmentId
      ? prisma.reviewerAssignment.update({
        where: {
          id: assignmentId,
        },
        data: {
          status:
            callStatus === "Completed"
              ? "Completed"
              : callStatus === "Cancelled"
                ? "Cancelled"
                : "In Progress",
          endDate: callStatus === "Completed" ? new Date() : undefined,
        },
      })
      : null;

  if (callStatus === "Completed") {
    const operations: Prisma.PrismaPromise<unknown>[] = [
      prisma.securityReview.update({
        where: {
          id: reviewId,
        },
        data: {
          status: "Completed",
          completedAt: new Date(),
        },
      }),
      prisma.reviewActivity.create({
        data: {
          reviewId,
          action: "Weekly call: completed",
          oldValue: review.status,
          newValue: "Completed",
          notes,
        },
      }),
    ];
    if (assignmentUpdate) operations.unshift(assignmentUpdate);
    await prisma.$transaction(operations);
  } else if (callStatus === "Cancelled") {
    const operations: Prisma.PrismaPromise<unknown>[] = [
      prisma.securityReview.update({
        where: {
          id: reviewId,
        },
        data: {
          status: "Cancelled",
          cancelledAt: new Date(),
        },
      }),
      prisma.reviewCancellation.upsert({
        where: {
          reviewId,
        },
        update: {
          reason: notes || "Cancelled during weekly governance call.",
          status: "Requested",
        },
        create: {
          reviewId,
          reason: notes || "Cancelled during weekly governance call.",
          status: "Requested",
        },
      }),
      prisma.reviewActivity.create({
        data: {
          reviewId,
          action: "Weekly call: cancelled",
          oldValue: review.status,
          newValue: "Cancelled",
          notes,
        },
      }),
    ];
    if (assignmentUpdate) operations.unshift(assignmentUpdate);
    await prisma.$transaction(operations);
  } else if (callStatus === "Extension Needed") {
    const requestedUntil = extensionTarget(formData);

    const operations: Prisma.PrismaPromise<unknown>[] = [
      prisma.securityReview.update({
        where: {
          id: reviewId,
        },
        data: {
          status: "In Progress",
          dueDate: requestedUntil,
        },
      }),
      prisma.reviewExtension.create({
        data: {
          reviewId,
          requestedUntil,
          reason: notes || "Extension requested during weekly governance call.",
          status: "Requested",
        },
      }),
      prisma.reviewActivity.create({
        data: {
          reviewId,
          action: "Weekly call: extension requested",
          oldValue: review.dueDate?.toISOString() ?? "No due date",
          newValue: requestedUntil.toISOString(),
          notes,
        },
      }),
    ];
    if (assignmentUpdate) operations.unshift(assignmentUpdate);
    await prisma.$transaction(operations);
  } else if (callStatus === "Rescheduled") {
    const dueDate = newDueDate ?? dateFromDays(7);

    const operations: Prisma.PrismaPromise<unknown>[] = [
      prisma.securityReview.update({
        where: {
          id: reviewId,
        },
        data: {
          status: "Requested",
          dueDate,
        },
      }),
      prisma.reviewActivity.create({
        data: {
          reviewId,
          action: "Weekly call: rescheduled",
          oldValue: review.dueDate?.toISOString() ?? "No due date",
          newValue: dueDate.toISOString(),
          notes,
        },
      }),
    ];
    if (assignmentUpdate) operations.unshift(assignmentUpdate);
    await prisma.$transaction(operations);
  } else {
    const operations: Prisma.PrismaPromise<unknown>[] = [
      prisma.securityReview.update({
        where: {
          id: reviewId,
        },
        data: {
          status: "In Progress",
          dueDate: newDueDate ?? undefined,
        },
      }),
      prisma.reviewActivity.create({
        data: {
          reviewId,
          action: "Weekly call: status confirmed",
          oldValue: review.status,
          newValue: "In Progress",
          notes,
        },
      }),
    ];
    if (assignmentUpdate) operations.unshift(assignmentUpdate);
    await prisma.$transaction(operations);
  }

  revalidatePath("/reviewers");
  revalidatePath("/reviewers/governance-call");
  revalidatePath("/reviews");
  revalidatePath("/projects");
  revalidatePath("/executive");
}
