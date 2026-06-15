import { prisma } from "../../lib/prisma";

export async function getDeveloperWorkload() {
  const users =
    await prisma.user.findMany({
      where: {
        role: {
          in: [
            "QA_REVIEWER",
            "REVIEWER",
            "SECURITY_LEAD",
            "DEVELOPER",
            "CONSULTANT",
            "GOVERNANCE_TEAM",
            "VIEWER",
          ],
        },
      },
      select: {
        id: true,
        name: true,
        role: true,
        assignedFindings: {
          select: {
            id: true,
          },
        },
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
