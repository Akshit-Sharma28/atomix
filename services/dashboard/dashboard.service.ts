import { prisma } from "../../lib/prisma";

export async function getDashboardMetrics() {
  const [
    total,
    critical,
    high,
    medium,
    low,
    open,
    closed,
  ] = await Promise.all([
    prisma.finding.count(),

    prisma.finding.count({
      where: {
        severity: "Critical",
      },
    }),

    prisma.finding.count({
      where: {
        severity: "High",
      },
    }),

    prisma.finding.count({
      where: {
        severity: "Medium",
      },
    }),

    prisma.finding.count({
      where: {
        severity: "Low",
      },
    }),

    prisma.finding.count({
      where: {
        status: "Open",
      },
    }),

    prisma.finding.count({
      where: {
        status: "Closed",
      },
    }),
  ]);

  return {
    total,
    critical,
    high,
    medium,
    low,
    open,
    closed,
  };
}