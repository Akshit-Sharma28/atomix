"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/services/users/access.service";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function assignValidatorToSpr(formData: FormData) {
  await requireAccess(["ADMIN", "GOVERNANCE_TEAM"]);

  const projectId = readString(formData, "projectId");
  const validatorId = readString(formData, "validatorId");

  if (!projectId || !validatorId) {
    redirect(
      "/workflow/scope-call?error=Select%20an%20SPR%20and%20validator.",
    );
  }

  const validator = await prisma.user.findFirst({
    where: {
      id: validatorId,
      role: "VALIDATOR",
      isActive: true,
    },
    select: {
      name: true,
    },
  });

  if (!validator) {
    redirect("/workflow/scope-call?error=Active%20validator%20not%20found.");
  }

  await prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      validatorId,
    },
  });

  revalidatePath("/workflow/scope-call");
  revalidatePath("/projects");
  redirect(
    `/workflow/scope-call?success=${encodeURIComponent(
      `${validator.name} was assigned to the selected SPR.`,
    )}`,
  );
}
