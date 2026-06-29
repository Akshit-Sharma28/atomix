"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/services/users/access.service";
import { getCurrentUser } from "@/services/users/current-user.service";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function dateFromDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function nextSrId(prefix: string) {
  return `${prefix}-${Date.now().toString().slice(-6)}`;
}

export async function createRetestRequest(formData: FormData) {
  const role = await requireAccess([
    "ADMIN",
    "GOVERNANCE_TEAM",
    "PROJECT_MANAGER",
  ]);
  const currentUser = await getCurrentUser();
  const projectId = text(formData, "projectId");
  const requestType = text(formData, "requestType") || "RETEST";
  const chargeCode = text(formData, "chargeCode");
  const scope = text(formData, "scope");
  const controlsCount = text(formData, "controlsCount");

  if (!projectId) {
    throw new Error("Project is required.");
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
      name: true,
      projectManagerId: true,
      sprId: true,
    },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  if (
    role === "PROJECT_MANAGER" &&
    project.projectManagerId &&
    project.projectManagerId !== currentUser?.id
  ) {
    throw new Error("Project managers can request reviews only for their assigned projects.");
  }

  const isRetest = requestType !== "INFOSEC_REVIEW";
  const review = await prisma.securityReview.create({
    data: {
      projectId,
      srId: nextSrId(isRetest ? "SR-RETEST" : "SR-REVIEW"),
      title: `${isRetest ? "Retest" : "Infosec Review"} - ${project.name}`,
      type: isRetest ? "RETEST" : "PENTEST",
      status: "Requested",
      priority: "Medium",
      dueDate: dateFromDays(isRetest ? 5 : 10),
      activities: {
        create: {
          action: isRetest ? "Retest requested" : "Infosec review requested",
          actor: currentUser?.name ?? currentUser?.email ?? "System",
          notes: [
            `Requested by: ${currentUser?.name ?? "Unknown"}`,
            chargeCode ? `Charge: ${chargeCode}` : null,
            controlsCount ? `Controls in scope: ${controlsCount}` : null,
            scope ? `Scope: ${scope}` : null,
          ]
            .filter(Boolean)
            .join(" | "),
        },
      },
    },
  });

  revalidatePath("/retest-governance");
  redirect(`/retest-governance?created=${review.id}`);
}

export async function assignRetestReviewer(formData: FormData) {
  await requireAccess(["ADMIN", "GOVERNANCE_TEAM"]);
  const currentUser = await getCurrentUser();
  const reviewId = text(formData, "reviewId");
  const reviewerProfileId = text(formData, "reviewerProfileId");
  const allocatedHours = Number(text(formData, "allocatedHours") || "8");

  if (!reviewId || !reviewerProfileId) {
    throw new Error("Review and reviewer are required.");
  }

  const reviewer = await prisma.reviewerProfile.findUnique({
    where: {
      id: reviewerProfileId,
    },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!reviewer) {
    throw new Error("Reviewer not found.");
  }

  await prisma.$transaction([
    prisma.reviewerAssignment.create({
      data: {
        reviewId,
        reviewerProfileId,
        userId: reviewer.userId,
        role: "Retester",
        status: "Assigned",
        allocatedHours: Number.isFinite(allocatedHours) ? allocatedHours : 8,
        startDate: new Date(),
      },
    }),
    prisma.securityReview.update({
      where: {
        id: reviewId,
      },
      data: {
        status: "In Progress",
        actualStartDate: new Date(),
      },
    }),
    prisma.reviewActivity.create({
      data: {
        reviewId,
        action: "Retest assigned",
        actor: currentUser?.name ?? currentUser?.email ?? "System",
        oldValue: "Requested",
        newValue: "In Progress",
        notes: `Assigned to ${reviewer.user.name} for ${Number.isFinite(allocatedHours) ? allocatedHours : 8} hours.`,
      },
    }),
  ]);

  revalidatePath("/retest-governance");
  redirect(`/retest-governance?assigned=${reviewId}`);
}
