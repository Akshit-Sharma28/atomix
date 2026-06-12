import { prisma } from "../../lib/prisma";

export async function getUsers() {
  return prisma.user.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function updateUserRole(
  userId: string,
  role: string
) {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      role: role as any,
    },
  });
}