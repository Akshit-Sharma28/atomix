"use server";

import { prisma } from "@/lib/prisma";

export async function createFinding(formData: FormData) {
  await prisma.finding.create({
    data: {
      title: formData.get("title") as string,
      severity: formData.get("severity") as string,
      source: formData.get("source") as string,
      projectId: formData.get("projectId") as string,
      status: "Open",
    },
  });
}
