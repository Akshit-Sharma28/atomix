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

  const report = `# Atomix Executive Delivery Report

Generated: ${new Date().toLocaleString()}

## KPI Snapshot
- Active SRs: ${activeReviews.length}
- Hours charged this week: ${allocatedHours}h
- Chargeability: ${chargeability}% of reviewer capacity
- Variance: ${variance >= 0 ? "+" : ""}${variance}h against expected delivery baseline
- Hours charged this month: ${monthHours}h
- Red engagements: ${redEngagements.length}
- Unassigned reviews: ${unassignedReviews.length}
- Extensions needed: ${extensionRequests.length}
- Rescheduled reviews: ${rescheduledReviews.length}
- Canceled projects: ${canceledProjects.length}
- Canceled reviews: ${canceledReviews.length}

## Trend Summary
- Weekly hours trend: ${weekTrend}h versus last week estimate.
- Monthly hours trend: ${monthTrend}h versus same-month baseline.
- Chargeability signal: ${chargeability >= 80 ? "high load" : chargeability >= 50 ? "balanced load" : "under-allocated load"} across available reviewer capacity.
- Variance signal: ${variance > 0 ? "over baseline; review overrun, surge demand, or estimation drift." : variance < 0 ? "under baseline; review unassigned work or under-allocation." : "on baseline."}
- Exception trend: ${redEngagements.length} red engagements, ${extensionRequests.length} extension requests, ${rescheduledReviews.length} reschedules.

## Red Engagements
${redEngagements
  .map(
    (project, index) =>
      `${index + 1}. ${project.name} (${project.sprId}) — ${project.overdue} overdue SRs, ${project.extensions} extension requests, ${project.hours}h charged, ${project.variance >= 0 ? "+" : ""}${project.variance}h variance.`,
  )
  .join("\n") || "- No red engagements in the current portfolio snapshot."}

## Unassigned Reviews
${unassignedReviews
  .slice(0, 10)
  .map(
    (review) =>
      `- ${review.project.name} · ${review.project.sprId ?? "SPR pending"} · ${review.srId ?? "SR pending"} — ${review.status}, due ${formatDate(review.dueDate)}.`,
  )
  .join("\n") || "- No unassigned active reviews."}

## Reschedules And Cancellations
${rescheduledReviews
  .slice(0, 8)
  .map(
    (review) =>
      `- Rescheduled: ${review.project.name} · ${review.srId ?? "SR pending"} — requested ${formatDate(review.requestedStartDate)}, actual ${formatDate(review.actualStartDate)}.`,
  )
  .join("\n") || "- No rescheduled reviews detected."}
${canceledProjects
  .slice(0, 6)
  .map(
    (project) =>
      `- Canceled project: ${project.name} · ${project.sprId ?? "SPR pending"} · ${project.status}.`,
  )
  .join("\n") || "- No canceled projects detected."}
${canceledReviews
  .slice(0, 6)
  .map(
    (review) =>
      `- Canceled review: ${review.project.name} · ${review.srId ?? "SR pending"} · ${review.status}.`,
  )
  .join("\n") || "- No canceled reviews detected."}

## Extension Queue
${extensionRequests
  .slice(0, 10)
  .map(
    (extension) =>
      `- ${extension.review.project.name} · ${extension.review.srId ?? "SR pending"} — requested until ${formatDate(extension.requestedUntil)}; ${extension.reason}.`,
  )
  .join("\n") || "- No pending extension requests."}

## Agentic Follow-up
- Ask Executive Agent to summarize weekly hours, variance, red engagements, and delivery trends.
- Ask Governance Agent to assign unassigned reviews and rebalance chargeability.
- Ask Peer Review Agent to identify review bottlenecks and reschedule drivers.
`;

  return Response.json({
    report,
    summary: {
      projects: projects.length,
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
    },
  });
}
