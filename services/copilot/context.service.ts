import { prisma } from "../../lib/prisma";

export async function buildContext() {
  const findings =
    await prisma.finding.findMany({
      include: {
        project: true,
        owner: true,
      },
    });

  const context = findings
    .map(
      (finding) => `
Title: ${finding.title}
Severity: ${finding.severity}
Status: ${finding.status}
Project: ${finding.project.name}
Owner: ${finding.owner?.name ?? "Unassigned"}
Description: ${finding.description ?? ""}
`
    )
    .join("\n\n");

  console.log("========== CONTEXT ==========");
  console.log(context);
  console.log("=============================");

  return context;
}