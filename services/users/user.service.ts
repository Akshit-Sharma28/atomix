import { prisma } from "../../lib/prisma";
import type { Role } from "@prisma/client";

export async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      reviewerPool: true,
      createdAt: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function updateUserRole(
  userId: string,
  role: Role
) {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      role,
    },
  });
}
