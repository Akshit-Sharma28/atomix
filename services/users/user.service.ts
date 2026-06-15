import { prisma } from "../../lib/prisma";

export async function getUsers() {
  return prisma.user.findMany({
    include: {
      reviewerProfile: {
        include: {
          assignments: {
            include: {
              review: {
                include: {
                  project: true,
                },
              },
            },
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
      },
      _count: {
        select: {
          reviewAssignments: true,
          assignedFindings: true,
        },
      },
    },
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
