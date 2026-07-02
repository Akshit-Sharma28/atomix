"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/services/users/access.service";

function textValue(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) ?? fallback).trim();
}

export async function updateVaultDocument(formData: FormData) {
  await requireAccess([
    "ADMIN",
    "GOVERNANCE_TEAM",
    "VALIDATOR",
    "ENGAGEMENT_MANAGER",
  ]);

  const id = textValue(formData, "documentId");

  if (!id) {
    throw new Error("Document is required");
  }

  await prisma.knowledgeDocument.update({
    where: {
      id,
    },
    data: {
      title: textValue(formData, "title", "Untitled document"),
      artifactType: textValue(formData, "artifactType", "Review Artifact"),
      documentType: textValue(formData, "artifactType", "Review Artifact"),
      scanner: textValue(formData, "scanner", "Manual / Evidence"),
      visibility: textValue(formData, "visibility", "REVIEW_TEAM"),
      folderName: textValue(formData, "folderName", "General"),
      content: textValue(formData, "content"),
    },
  });

  revalidatePath("/import");
  revalidatePath("/knowledge");
}

export async function deleteVaultDocument(formData: FormData) {
  await requireAccess([
    "ADMIN",
    "GOVERNANCE_TEAM",
    "VALIDATOR",
    "ENGAGEMENT_MANAGER",
  ]);

  const id = textValue(formData, "documentId");

  if (!id) {
    throw new Error("Document is required");
  }

  await prisma.knowledgeDocument.delete({
    where: {
      id,
    },
  });

  revalidatePath("/import");
  revalidatePath("/knowledge");
}
