"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createFinding(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const reviewId = String(formData.get("reviewId") ?? "") || undefined;
  const ownerId = String(formData.get("ownerId") ?? "") || undefined;
  const dueDate = String(formData.get("dueDate") ?? "");
  const controlId = String(formData.get("controlId") ?? "").trim();
  const controlDetail =
    String(formData.get("controlDetail") ?? "").trim();
  const controlRemediation =
    String(formData.get("controlRemediation") ?? "").trim();
  const reviewerComment =
    String(formData.get("reviewerComment") ?? "").trim();
  const aiAnalysis =
    String(formData.get("aiAnalysis") ?? "").trim();
  const evidenceImages = formData
    .getAll("evidenceImages")
    .filter((item): item is File => item instanceof File && item.size > 0)
    .map((file) => `${file.name} (${Math.round(file.size / 1024)} KB)`);

  const providedDescription =
    String(formData.get("description") ?? "").trim();
  const providedRemediation =
    String(formData.get("remediation") ?? "").trim();

  const description =
    providedDescription ||
    [
      controlId ? `Control: ${controlId}` : "",
      controlDetail ? `Control Detail: ${controlDetail}` : "",
      reviewerComment ? `Reviewer Comment: ${reviewerComment}` : "",
      aiAnalysis ? `AI Analysis: ${aiAnalysis}` : "",
      evidenceImages.length > 0
        ? `Evidence Images: ${evidenceImages.join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

  const remediation =
    providedRemediation ||
    [
      controlRemediation
        ? `Recommended Remediation: ${controlRemediation}`
        : "",
      aiAnalysis ? `AI Suggested Detail: ${aiAnalysis}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

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
      description: description || undefined,
      remediation: remediation || undefined,
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
