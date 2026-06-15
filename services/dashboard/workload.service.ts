import { prisma } from "../../lib/prisma";

export async function getDeveloperWorkload() {
  const users =
    await prisma.user.findMany({
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

  const workloadRoles = [
    "QA_REVIEWER",
    "REVIEWER",
    "SECURITY_LEAD",
    "DEVELOPER",
    "CONSULTANT",
    "GOVERNANCE_TEAM",
    "VIEWER",
  ];

  return users.filter((user) =>
    workloadRoles.includes(user.role)
  ).map((user) => ({
    id: user.id,
    name: user.name,
    role: user.role,
    findingCount:
      user.assignedFindings.length,
  }));
}
