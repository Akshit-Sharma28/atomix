"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createFinding(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const reviewId = String(formData.get("reviewId") ?? "") || undefined;
  const ownerId = String(formData.get("ownerId") ?? "") || undefined;
  const dueDate = String(formData.get("dueDate") ?? "");

  await prisma.finding.create({
    data: {
      title: formData.get("title") as string,
      severity: formData.get("severity") as string,
      source: String(formData.get("source") ?? "Manual Review"),
      status: String(formData.get("status") ?? "Open"),
      projectId,
      reviewId,
      ownerId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      description: String(formData.get("description") ?? "") || undefined,
      remediation: String(formData.get("remediation") ?? "") || undefined,
      cweId: String(formData.get("cweId") ?? "") || undefined,
      owaspCategory:
        String(formData.get("owaspCategory") ?? "") || undefined,
    },
  });

  revalidatePath("/findings");
  revalidatePath("/my-findings");

  if (projectId) {
    redirect(`/my-findings?projectId=${projectId}`);
  }

  redirect("/findings");
}
