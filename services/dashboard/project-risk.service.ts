import { prisma } from "../../lib/prisma";
import { calculateRisk } from "../risk/risk.service";

export async function getProjectRiskSummary() {
  const projects =
    await prisma.project.findMany({
      include: {
        findings: true,
      },
    });

  return projects.map((project) => ({
    id: project.id,

    name: project.name,

    client: project.client,

    riskScore: calculateRisk(
      project.findings
    ),

    openCount:
      project.findings.filter(
        (f) => f.status === "Open"
      ).length,
  }));
}