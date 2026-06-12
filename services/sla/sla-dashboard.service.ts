import { prisma } from "../../lib/prisma";

export async function getSLAMetrics() {
  const findings = await prisma.finding.findMany();

  const now = new Date();

  const overdue = findings.filter(
    (f) =>
      f.dueDate &&
      new Date(f.dueDate) < now &&
      f.status !== "Closed"
  );

  const dueSoon = findings.filter((f) => {
    if (!f.dueDate) return false;

    const diff =
      (new Date(f.dueDate).getTime() -
        now.getTime()) /
      (1000 * 60 * 60 * 24);

    return diff >= 0 && diff <= 7;
  });

  const compliant =
    findings.length -
    overdue.length;

  const compliancePercent =
    findings.length === 0
      ? 100
      : Math.round(
          (compliant /
            findings.length) *
            100
        );

  return {
    total: findings.length,
    overdue: overdue.length,
    dueSoon: dueSoon.length,
    compliancePercent,
  };
}