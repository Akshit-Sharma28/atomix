import { prisma } from "../../lib/prisma";
import { calculateRisk } from "../risk/risk.service";
import { getRetestGovernanceDashboard } from "./retest-governance.service";

export type ExecutiveSort =
  | "variance"
  | "risk"
  | "overdue"
  | "updated";

export type ExecutiveFilter =
  | "all"
  | "active"
  | "red"
  | "completed";

function isOverdue(dueDate?: Date | null) {
  return Boolean(dueDate && dueDate.getTime() < Date.now());
}

function statusMatches(status: string, filter: ExecutiveFilter) {
  if (filter === "all") {
    return true;
  }

  if (filter === "completed") {
    return ["Completed", "Closed"].includes(status);
  }

  if (filter === "active") {
    return !["Completed", "Closed", "Cancelled"].includes(status);
  }

  return true;
}

export async function getExecutiveDashboard({
  sort = "variance",
  filter = "all",
  search = "",
}: {
  sort?: ExecutiveSort;
  filter?: ExecutiveFilter;
  search?: string;
}) {
  const [projects, retestGovernance] = await Promise.all([
    prisma.project.findMany({
      include: {
        findings: {
          select: {
            severity: true,
            status: true,
          },
        },
        reviews: {
          include: {
            assignments: true,
            extensions: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    getRetestGovernanceDashboard(),
  ]);

  const rows = projects.map((project) => {
    const activeReviews = project.reviews.filter(
      (review) =>
        !["Completed", "Cancelled"].includes(review.status),
    );
    const overdueReviews = activeReviews.filter((review) =>
      isOverdue(review.dueDate),
    );
    const pendingExtensions = project.reviews.flatMap((review) =>
      review.extensions.filter(
        (extension) =>
          !["Approved", "Rejected"].includes(extension.status),
      ),
    );
    const allocatedHours = project.reviews.reduce(
      (total, review) =>
        total +
        review.assignments.reduce(
          (assignmentTotal, assignment) =>
            assignmentTotal + (assignment.allocatedHours ?? 0),
          0,
        ),
      0,
    );
    const expectedHours = Math.max(8, activeReviews.length * 16);
    const variance = allocatedHours - expectedHours;
    const riskScore = calculateRisk(project.findings);
    const criticalOpen = project.findings.filter(
      (finding) =>
        finding.severity === "Critical" &&
        finding.status !== "Closed",
    ).length;

    return {
      id: project.id,
      name: project.name,
      client: project.client ?? "Internal",
      sprId: project.sprId ?? "SPR pending",
      status: project.status,
      riskTier: project.riskTier ?? "Unrated",
      riskScore,
      openFindings: project.findings.filter(
        (finding) => finding.status !== "Closed",
      ).length,
      criticalOpen,
      activeReviews: activeReviews.length,
      overdueReviews: overdueReviews.length,
      pendingExtensions: pendingExtensions.length,
      allocatedHours,
      expectedHours,
      variance,
      latestReview:
        project.reviews[0]?.srId ??
        project.reviews[0]?.title ??
        "No SR",
      updatedAt: project.updatedAt,
      red:
        overdueReviews.length > 0 ||
        criticalOpen > 0 ||
        pendingExtensions.length > 0,
    };
  });

  const normalizedSearch = search.trim().toLowerCase();
  const filteredRows = rows.filter((row) => {
    const matchesFilter =
      filter === "red"
        ? row.red
        : statusMatches(row.status, filter);
    const matchesSearch =
      !normalizedSearch ||
      [
        row.name,
        row.client,
        row.sprId,
        row.status,
        row.riskTier,
        row.latestReview,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

    return matchesFilter && matchesSearch;
  });

  filteredRows.sort((left, right) => {
    if (sort === "risk") {
      return right.riskScore - left.riskScore;
    }

    if (sort === "overdue") {
      return right.overdueReviews - left.overdueReviews;
    }

    if (sort === "updated") {
      return right.updatedAt.getTime() - left.updatedAt.getTime();
    }

    return Math.abs(right.variance) - Math.abs(left.variance);
  });

  const totalHours = rows.reduce(
    (total, row) => total + row.allocatedHours,
    0,
  );
  const totalExpected = rows.reduce(
    (total, row) => total + row.expectedHours,
    0,
  );

  return {
    summary: {
      projects: rows.length,
      redProjects: rows.filter((row) => row.red).length,
      activeReviews: rows.reduce(
        (total, row) => total + row.activeReviews,
        0,
      ),
      overdueReviews: rows.reduce(
        (total, row) => total + row.overdueReviews,
        0,
      ),
      allocatedHours: totalHours,
      variance: totalHours - totalExpected,
    },
    trends: [
      {
        label: "Delivery Load",
        value: `${totalHours}h`,
        direction:
          totalHours >= totalExpected
            ? "up"
            : "down",
        detail:
          totalHours >= totalExpected
            ? "Allocated hours are above expected active-review baseline."
            : "Allocated hours are below expected active-review baseline.",
      },
      {
        label: "Escalation Pressure",
        value: rows
          .filter((row) => row.red)
          .length.toString(),
        direction:
          rows.some((row) => row.red)
            ? "watch"
            : "stable",
        detail:
          "Projects turn red when overdue reviews, critical open findings, or pending extensions exist.",
      },
      {
        label: "Portfolio Freshness",
        value:
          rows[0]?.updatedAt.toLocaleDateString("en", {
            month: "short",
            day: "numeric",
          }) ?? "No data",
        direction: "stable",
        detail:
          "Most recently updated project record in the executive portfolio.",
      },
    ],
    insights: [
      rows.filter((row) => row.red).length > 0
        ? `${rows.filter((row) => row.red).length} projects require leadership attention due to red delivery or risk signals.`
        : "No red projects detected in the current portfolio view.",
      totalHours - totalExpected > 0
        ? `Portfolio is running ${totalHours - totalExpected}h above expected allocation baseline; review capacity and chargeability variance.`
        : `Portfolio is ${Math.abs(totalHours - totalExpected)}h under expected allocation baseline; check whether reviews are under-staffed or not yet assigned.`,
      rows.some((row) => row.pendingExtensions > 0)
        ? "Pending extension requests exist; leadership should ask for owner decisions and revised timelines."
        : "No pending extension pressure detected across current project records.",
      retestGovernance.summary.overdue > 0
        ? `${retestGovernance.summary.overdue} retest requests are overdue; validate project-team fix readiness and reviewer assignment.`
        : "No overdue retest requests detected in the retest governance queue.",
    ],
    retestSummary: retestGovernance.summary,
    retestInsights: retestGovernance.insights,
    rows: filteredRows,
  };
}
