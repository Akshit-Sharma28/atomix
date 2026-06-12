import { prisma } from "../../lib/prisma";

export async function getDeveloperWorkload() {
  const users =
    await prisma.user.findMany({
      include: {
        assignedFindings: true,
      },
      orderBy: {
        name: "asc",
      },
    });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    role: user.role,
    findingCount:
      user.assignedFindings.length,
  }));
}