"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, type Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/services/users/access.service";

const allowedRoles: readonly Role[] = [
  "ADMIN",
  "GOVERNANCE_TEAM",
  "VALIDATOR",
  "EXECUTIVE",
  "PROJECT_MANAGER",
  "ENGAGEMENT_MANAGER",
  "QA_REVIEWER",
  "REVIEWER",
  "RETESTER",
];

const allowedReviewerPools = ["Augmentation", "Dedicated"];

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readRole(formData: FormData) {
  const role = readString(formData, "role");

  if (!allowedRoles.includes(role as Role)) {
    return "REVIEWER";
  }

  return role as Role;
}

function readReviewerPool(formData: FormData) {
  const reviewerPool = readString(formData, "reviewerPool");

  if (!allowedReviewerPools.includes(reviewerPool)) {
    return "Augmentation";
  }

  return reviewerPool;
}

function usersRedirect(kind: "error" | "success", message: string): never {
  redirect(`/users?${kind}=${encodeURIComponent(message)}`);
}

function friendlyPrismaError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "That email is already assigned to another user. Use a unique email.";
  }

  return "Unable to save the user change. Please check the fields and try again.";
}

async function requireAdminOrRedirect() {
  try {
    await requireAccess(["ADMIN"]);
  } catch {
    usersRedirect("error", "Only admin users can manage accounts.");
  }
}

export async function createUser(formData: FormData) {
  await requireAdminOrRedirect();

  const name = readString(formData, "name");
  const email = readString(formData, "email").toLowerCase();
  const role = readRole(formData);
  const reviewerPool = readReviewerPool(formData);
  const password = readString(formData, "password");

  if (!name || !email) {
    usersRedirect("error", "Name and email are required.");
  }

  if (password && password.length < 8) {
    usersRedirect("error", "Password must be at least 8 characters.");
  }

  try {
    const user = await prisma.user.upsert({
      where: {
        email,
      },
      update: {
        name,
        role,
        reviewerPool,
        isActive: true,
      },
      create: {
        name,
        email,
        role,
        reviewerPool,
        isActive: true,
      },
    });

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);

      await prisma.account.upsert({
        where: {
          userId: user.id,
        },
        update: {
          passwordHash,
        },
        create: {
          userId: user.id,
          passwordHash,
        },
      });
    }
  } catch (error) {
    usersRedirect("error", friendlyPrismaError(error));
  }

  revalidatePath("/users");
  usersRedirect("success", `${name} was saved.`);
}

export async function updateUser(formData: FormData) {
  await requireAdminOrRedirect();

  const userId = readString(formData, "userId");
  const name = readString(formData, "name");
  const email = readString(formData, "email").toLowerCase();
  const role = readRole(formData);
  const reviewerPool = readReviewerPool(formData);
  const isActive = formData.get("isActive") === "on";

  if (!userId || !name || !email) {
    usersRedirect("error", "User, name, and email are required.");
  }

  const duplicateEmail = await prisma.user.findFirst({
    where: {
      email,
      id: {
        not: userId,
      },
    },
    select: {
      name: true,
    },
  });

  if (duplicateEmail) {
    usersRedirect(
      "error",
      `Email is already assigned to ${duplicateEmail.name}. Use a unique email.`,
    );
  }

  try {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name,
        email,
        role,
        reviewerPool,
        isActive,
      },
    });
  } catch (error) {
    usersRedirect("error", friendlyPrismaError(error));
  }

  revalidatePath("/users");
  revalidatePath("/profile");
  usersRedirect("success", `${name} was updated.`);
}

export async function deactivateUser(formData: FormData) {
  await requireAdminOrRedirect();

  const userId = readString(formData, "userId");

  if (!userId) {
    usersRedirect("error", "User is required.");
  }

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      isActive: false,
    },
  });

  revalidatePath("/users");
  usersRedirect("success", "User was deactivated.");
}

export async function resetUserPassword(formData: FormData) {
  await requireAdminOrRedirect();

  const userId = readString(formData, "userId");
  const password = readString(formData, "password");

  if (!userId) {
    usersRedirect("error", "User is required.");
  }

  if (password.length < 8) {
    usersRedirect("error", "Password must be at least 8 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.account.upsert({
    where: {
      userId,
    },
    update: {
      passwordHash,
    },
    create: {
      userId,
      passwordHash,
    },
  });

  revalidatePath("/users");
  usersRedirect("success", "Password was reset.");
}
