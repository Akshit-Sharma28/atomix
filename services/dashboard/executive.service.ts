import { prisma } from "../../lib/prisma";
import { calculateRisk } from "../risk/risk.service";

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
}: {
  sort?: ExecutiveSort;
  filter?: ExecutiveFilter;
}) {
  const projects = await prisma.project.findMany({
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
  });

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

  const filteredRows = rows.filter((row) =>
    filter === "red"
      ? row.red
      : statusMatches(row.status, filter),
  );

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
    rows: filteredRows,
  };
}
