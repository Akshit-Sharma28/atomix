"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/services/users/access.service";

const allowedRoles = [
  "ADMIN",
  "GOVERNANCE_TEAM",
  "EXECUTIVE",
  "ENGAGEMENT_MANAGER",
  "QA_REVIEWER",
  "REVIEWER",
];

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readRole(formData: FormData) {
  const role = readString(formData, "role");

  if (!allowedRoles.includes(role)) {
    return "REVIEWER";
  }

  return role;
}

export async function createUser(formData: FormData) {
  await requireAccess(["ADMIN"]);

  const name = readString(formData, "name");
  const email = readString(formData, "email").toLowerCase();
  const role = readRole(formData);
  const password = readString(formData, "password");

  if (!name || !email) {
    throw new Error("Name and email are required");
  }

  const user = await prisma.user.upsert({
    where: {
      email,
    },
    update: {
      name,
      role: role as any,
      isActive: true,
    },
    create: {
      name,
      email,
      role: role as any,
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

  revalidatePath("/users");
}

export async function updateUser(formData: FormData) {
  await requireAccess(["ADMIN"]);

  const userId = readString(formData, "userId");
  const name = readString(formData, "name");
  const email = readString(formData, "email").toLowerCase();
  const role = readRole(formData);
  const isActive = formData.get("isActive") === "on";

  if (!userId || !name || !email) {
    throw new Error("User, name, and email are required");
  }

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      name,
      email,
      role: role as any,
      isActive,
    },
  });

  revalidatePath("/users");
  revalidatePath("/profile");
}

export async function deactivateUser(formData: FormData) {
  await requireAccess(["ADMIN"]);

  const userId = readString(formData, "userId");

  if (!userId) {
    throw new Error("User is required");
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
}
