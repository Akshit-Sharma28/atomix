import { prisma } from "../../lib/prisma";

export async function getDashboardMetrics() {
  const findings =
    await prisma.finding.findMany();

  return {
    total: findings.length,

    critical: findings.filter(
      (f) => f.severity === "Critical"
    ).length,

    high: findings.filter(
      (f) => f.severity === "High"
    ).length,

    medium: findings.filter(
      (f) => f.severity === "Medium"
    ).length,

    low: findings.filter(
      (f) => f.severity === "Low"
    ).length,

    open: findings.filter(
      (f) => f.status === "Open"
    ).length,

    closed: findings.filter(
      (f) => f.status === "Closed"
    ).length,
  };
}