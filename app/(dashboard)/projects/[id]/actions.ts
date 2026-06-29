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

function srStem(sprId: string | null, fallbackId: string) {
  const numericPart = sprId?.match(/\d+/)?.[0];

  if (numericPart) {
    return `SR-${numericPart}`;
  }

  return `SR-${fallbackId.slice(-6).toUpperCase()}`;
}

async function nextSrId(projectId: string, sprId: string | null) {
  const year = new Date().getFullYear();
  const stem = srStem(sprId, projectId);
  const existingCount = await prisma.securityReview.count({
    where: {
      projectId,
    },
  });
  const baseId = `${stem}-${year}`;

  if (existingCount === 0) {
    return baseId;
  }

  return `${baseId}-${String(existingCount + 1).padStart(2, "0")}`;
}

export async function createProjectSecurityReview(formData: FormData) {
  await requireAccess([
    "ADMIN",
    "GOVERNANCE_TEAM",
    "PROJECT_MANAGER",
    "ENGAGEMENT_MANAGER",
    "VALIDATOR",
  ]);

  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "PENTEST");
  const priority = String(formData.get("priority") ?? "Medium");
  const requestedStartDate = optionalDate(formData.get("requestedStartDate"));
  const dueDate = optionalDate(formData.get("dueDate"));
  const workstream = String(formData.get("workstream") ?? type).trim();

  if (!projectId || !title) {
    throw new Error("Project and SR title are required");
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
      sprId: true,
    },
  });

  if (!project) {
    throw new Error("SPR not found");
  }

  await prisma.securityReview.create({
    data: {
      projectId,
      title,
      type,
      priority,
      status: "Requested",
      srId: await nextSrId(project.id, project.sprId),
      requestedStartDate,
      dueDate,
      workstreams: {
        create: {
          type: workstream || type,
          status: "Not Started",
          required: true,
        },
      },
      activities: {
        create: {
          action: "SR Created",
          actor: "Atomix Governance",
          notes: "Created from the SPR detail page.",
        },
      },
    },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/reviews");
  revalidatePath("/reviewers");
  revalidatePath("/reviewers/governance-call");
  revalidatePath("/executive");
}
