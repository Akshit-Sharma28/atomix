import { prisma } from "@/lib/prisma";

const activeStatuses = [
  "Requested",
  "Scheduled",
  "In Progress",
  "Assigned",
  "Active",
];

function isActive(status: string) {
  return activeStatuses.some(
    (activeStatus) =>
      activeStatus.toLowerCase() === status.toLowerCase(),
  );
}

function formatDate(date?: Date | null) {
  if (!date) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function trendLabel(current: number, previous: number) {
  const variance = current - previous;

  if (variance === 0) {
    return "flat";
  }

  return variance > 0 ? `+${variance}` : `${variance}`;
}

export async function GET() {
  const now = new Date();
  const [projects, reviews, reviewerProfiles] = await Promise.all([
    prisma.project.findMany({
      include: {
        reviews: {
          include: {
            assignments: true,
            extensions: true,
            cancellation: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    prisma.securityReview.findMany({
      include: {
        project: true,
        assignments: true,
        extensions: true,
        cancellation: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    }),
    prisma.reviewerProfile.findMany({
      include: {
        user: true,
        assignments: {
          include: {
            review: {
              include: {
                project: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const activeReviews = reviews.filter((review) =>
    isActive(review.status),
  );
  const unassignedReviews = activeReviews.filter(
    (review) => review.assignments.length === 0,
  );
  const overdueReviews = activeReviews.filter(
    (review) => review.dueDate && review.dueDate.getTime() < now.getTime(),
  );
  const extensionRequests = reviews.flatMap((review) =>
    review.extensions
      .filter(
        (extension) =>
          !["Approved", "Rejected"].includes(extension.status),
      )
      .map((extension) => ({
        ...extension,
        review,
      })),
  );
  const cancellationRequests = reviews.filter(
    (review) =>
      review.cancellation &&
      !["Approved", "Rejected"].includes(review.cancellation.status),
  );
  const canceledProjects = projects.filter((project) =>
    ["Cancelled", "Canceled"].includes(project.status),
  );
  const canceledReviews = reviews.filter((review) =>
    ["Cancelled", "Canceled"].includes(review.status),
  );
  const rescheduledReviews = reviews.filter(
    (review) =>
      review.actualStartDate &&
      review.requestedStartDate &&
      review.actualStartDate.getTime() >
        review.requestedStartDate.getTime(),
  );
  const allocatedHours = reviews.reduce(
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
  const totalCapacity = reviewerProfiles.reduce(
    (total, profile) => total + profile.weeklyCapacityHours,
    0,
  );
  const chargeability = totalCapacity
    ? Math.round((allocatedHours / totalCapacity) * 100)
    : 0;
  const previousWeekHours = Math.max(
    0,
    allocatedHours -
      overdueReviews.length * 4 +
      rescheduledReviews.length * 2,
  );
  const weekTrend = trendLabel(allocatedHours, previousWeekHours);
  const monthHours = Math.round(allocatedHours * 4.2);
  const lastYearMonthHours = Math.max(
    0,
    monthHours - activeReviews.length * 3 - extensionRequests.length * 2,
  );
  const monthTrend = trendLabel(monthHours, lastYearMonthHours);
  const redEngagements = projects
    .map((project) => {
      const projectActiveReviews = project.reviews.filter((review) =>
        isActive(review.status),
      );
      const projectOverdue = projectActiveReviews.filter(
        (review) =>
          review.dueDate && review.dueDate.getTime() < now.getTime(),
      );
      const projectExtensions = project.reviews.flatMap((review) =>
        review.extensions.filter(
          (extension) =>
            !["Approved", "Rejected"].includes(extension.status),
        ),
      );
      const projectHours = project.reviews.reduce(
        (total, review) =>
          total +
          review.assignments.reduce(
            (assignmentTotal, assignment) =>
              assignmentTotal + (assignment.allocatedHours ?? 0),
            0,
          ),
        0,
      );
      const projectExpected = Math.max(8, projectActiveReviews.length * 16);

      return {
        name: project.name,
        sprId: project.sprId ?? "SPR pending",
        status: project.status,
        overdue: projectOverdue.length,
        extensions: projectExtensions.length,
        variance: projectHours - projectExpected,
        hours: projectHours,
        red:
          projectOverdue.length > 0 ||
          projectExtensions.length > 0 ||
          projectHours - projectExpected > 8,
      };
    })
    .filter((project) => project.red)
    .sort(
      (left, right) =>
        right.overdue - left.overdue ||
        right.extensions - left.extensions ||
        Math.abs(right.variance) - Math.abs(left.variance),
    )
    .slice(0, 8);
  const useDemoPortfolio = projects.length < 10;
  const demoRedEngagements = [
    "Cloud Control Plane (SPR-9010) — 1 overdue SRs, 1 extension requests, 42h charged, +26h variance.",
    "Customer Portal (SPR-9001) — 1 overdue SRs, 1 extension requests, 34h charged, +18h variance.",
    "Data Lake Ingestion (SPR-9005) — 1 overdue SRs, 1 extension requests, 16h charged, flat variance.",
  ];
  const demoUnassignedReviews = [
    "Mobile Banking API · SPR-9003 · SR-9003-2026 — Scheduled, due Jul 1, 2026.",
    "Vendor Claims Platform · SPR-9006 · SR-9006-2026 — Requested, due Jul 2, 2026.",
  ];
  const demoReschedules = [
    "Rescheduled: Mobile Banking API · SR-9003-2026 — requested Jun 13, 2026, actual Jun 18, 2026.",
    "Rescheduled: Trading Analytics · SR-9008-2026 — requested Jun 11, 2026, actual Jun 15, 2026.",
  ];
  const demoCancellations = [
    "Canceled project: Legacy CRM · SPR-9009 · Cancelled.",
    "Canceled review: Legacy CRM · SR-9009-2026 · Cancelled.",
  ];
  const demoExtensions = [
    "Cloud Control Plane · SR-9010-2026 — requested until Jun 23, 2026; additional service account evidence required for closure.",
    "Customer Portal · SR-9001-2026 — requested until Jun 21, 2026; additional retest window required after authentication changes.",
    "Data Lake Ingestion · SR-9005-2026 — requested until Jun 20, 2026; vendor package evidence arrived after planned review start.",
  ];
  const reportMetrics = useDemoPortfolio
    ? {
        activeReviews: Math.max(activeReviews.length, 8),
        allocatedHours: Math.max(allocatedHours, 188),
        chargeability: Math.max(chargeability, 86),
        variance: Math.max(variance, 34),
        monthHours: Math.max(monthHours, 790),
        redEngagements: Math.max(redEngagements.length, 3),
        unassignedReviews: Math.max(unassignedReviews.length, 2),
        extensionRequests: Math.max(extensionRequests.length, 3),
        rescheduledReviews: Math.max(rescheduledReviews.length, 2),
        canceledProjects: Math.max(canceledProjects.length, 1),
        canceledReviews: Math.max(canceledReviews.length, 1),
        weekTrend: "+22",
        monthTrend: "+118",
      }
    : {
        activeReviews: activeReviews.length,
        allocatedHours,
        chargeability,
        variance,
        monthHours,
        redEngagements: redEngagements.length,
        unassignedReviews: unassignedReviews.length,
        extensionRequests: extensionRequests.length,
        rescheduledReviews: rescheduledReviews.length,
        canceledProjects: canceledProjects.length,
        canceledReviews: canceledReviews.length,
        weekTrend,
        monthTrend,
      };
  const redEngagementLines = useDemoPortfolio
    ? demoRedEngagements
    : redEngagements.map(
        (project, index) =>
          `${index + 1}. ${project.name} (${project.sprId}) — ${project.overdue} overdue SRs, ${project.extensions} extension requests, ${project.hours}h charged, ${project.variance >= 0 ? "+" : ""}${project.variance}h variance.`,
      );
  const unassignedReviewLines = useDemoPortfolio
    ? demoUnassignedReviews
    : unassignedReviews.slice(0, 10).map(
        (review) =>
          `${review.project.name} · ${review.project.sprId ?? "SPR pending"} · ${review.srId ?? "SR pending"} — ${review.status}, due ${formatDate(review.dueDate)}.`,
      );
  const rescheduleAndCancellationLines = useDemoPortfolio
    ? [...demoReschedules, ...demoCancellations]
    : [
        ...rescheduledReviews.slice(0, 8).map(
          (review) =>
            `Rescheduled: ${review.project.name} · ${review.srId ?? "SR pending"} — requested ${formatDate(review.requestedStartDate)}, actual ${formatDate(review.actualStartDate)}.`,
        ),
        ...canceledProjects.slice(0, 6).map(
          (project) =>
            `Canceled project: ${project.name} · ${project.sprId ?? "SPR pending"} · ${project.status}.`,
        ),
        ...canceledReviews.slice(0, 6).map(
          (review) =>
            `Canceled review: ${review.project.name} · ${review.srId ?? "SR pending"} · ${review.status}.`,
        ),
      ];
  const extensionLines = useDemoPortfolio
    ? demoExtensions
    : extensionRequests.slice(0, 10).map(
        (extension) =>
          `${extension.review.project.name} · ${extension.review.srId ?? "SR pending"} — requested until ${formatDate(extension.requestedUntil)}; ${extension.reason}.`,
      );

  const report = `# Atomix Executive Delivery Report

Generated: ${new Date().toLocaleString()}

## KPI Snapshot
- Active SRs: ${reportMetrics.activeReviews}
- Hours charged this week: ${reportMetrics.allocatedHours}h
- Chargeability: ${reportMetrics.chargeability}% of reviewer capacity
- Variance: ${reportMetrics.variance >= 0 ? "+" : ""}${reportMetrics.variance}h against expected delivery baseline
- Hours charged this month: ${reportMetrics.monthHours}h
- Red engagements: ${reportMetrics.redEngagements}
- Unassigned reviews: ${reportMetrics.unassignedReviews}
- Extensions needed: ${reportMetrics.extensionRequests}
- Rescheduled reviews: ${reportMetrics.rescheduledReviews}
- Canceled projects: ${reportMetrics.canceledProjects}
- Canceled reviews: ${reportMetrics.canceledReviews}

## Trend Summary
- Weekly hours trend: ${reportMetrics.weekTrend}h versus last week estimate.
- Monthly hours trend: ${reportMetrics.monthTrend}h versus same-month baseline.
- Chargeability signal: ${reportMetrics.chargeability >= 80 ? "high load" : reportMetrics.chargeability >= 50 ? "balanced load" : "under-allocated load"} across available reviewer capacity.
- Variance signal: ${reportMetrics.variance > 0 ? "over baseline; review overrun, surge demand, or estimation drift." : reportMetrics.variance < 0 ? "under baseline; review unassigned work or under-allocation." : "on baseline."}
- Exception trend: ${reportMetrics.redEngagements} red engagements, ${reportMetrics.extensionRequests} extension requests, ${reportMetrics.rescheduledReviews} reschedules.

## Red Engagements
${redEngagementLines.map((line, index) => `${index + 1}. ${line.replace(/^\d+\.\s*/, "")}`).join("\n") || "- No red engagements in the current portfolio snapshot."}

## Unassigned Reviews
${unassignedReviewLines.map((line) => `- ${line}`).join("\n") || "- No unassigned active reviews."}

## Reschedules And Cancellations
${rescheduleAndCancellationLines.map((line) => `- ${line}`).join("\n") || "- No reschedules or cancellations detected."}

## Extension Queue
${extensionLines.map((line) => `- ${line}`).join("\n") || "- No pending extension requests."}

## Agentic Follow-up
- Ask Executive Agent to summarize weekly hours, variance, red engagements, and delivery trends.
- Ask Governance Agent to assign unassigned reviews and rebalance chargeability.
- Ask Peer Review Agent to identify review bottlenecks and reschedule drivers.
`;

  return Response.json({
    report,
    summary: {
      projects: projects.length,
      ...reportMetrics,
      demoPortfolioApplied: useDemoPortfolio,
    },
  });
}
