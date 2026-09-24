import { prisma } from "@/lib/prisma";
import { getExecutiveDashboard } from "@/services/dashboard/executive.service";

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

export async function GET(request: Request) {
  const requestedSource = new URL(request.url).searchParams.get("source");
  const productivitySource = requestedSource === "live" ? "live" : "scenario";
  const [reviews, reviewerProfiles, executive] = await Promise.all([
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
    getExecutiveDashboard({ productivitySource }),
  ]);

  const activeReviews = reviews.filter((review) =>
    isActive(review.status),
  );
  const unassignedReviews = activeReviews.filter(
    (review) => review.assignments.length === 0,
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
  const canceledProjects = executive.rows.filter((project) =>
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
  const allocatedHours = executive.summary.allocatedHours;
  const variance = executive.summary.variance;
  const totalCapacity = reviewerProfiles.reduce(
    (total, profile) => total + profile.weeklyCapacityHours,
    0,
  );
  const capacityUtilization = totalCapacity
    ? Math.round((allocatedHours / totalCapacity) * 100)
    : 0;
  const monthHours = Math.round(allocatedHours * 4.2);
  const redEngagements = executive.rows
    .filter((project) => project.red)
    .sort(
      (left, right) =>
        right.overdueReviews - left.overdueReviews ||
        right.criticalOpen - left.criticalOpen ||
        right.pendingExtensions - left.pendingExtensions ||
        Math.abs(right.variance) - Math.abs(left.variance),
    )
    .slice(0, 8);
  const reportMetrics = {
    activeReviews: executive.summary.activeReviews,
    allocatedHours,
    capacityUtilization,
    variance,
    monthHours,
    redEngagements: executive.summary.redProjects,
    unassignedReviews: unassignedReviews.length,
    extensionRequests: extensionRequests.length,
    rescheduledReviews: rescheduledReviews.length,
    canceledProjects: canceledProjects.length,
    canceledReviews: canceledReviews.length,
  };
  const productivity = {
    baselinePeople: executive.productivity.adoptionUsers,
    baselineDailyHoursPerPerson:
      executive.productivity.adoptionHoursSavedPerUserPerDay,
    workdayHours: executive.productivity.workdayHours,
    workdaysPerWeek: executive.productivity.workdaysPerWeek,
    workingWeeksPerYear: executive.productivity.workingWeeksPerYear,
    measuredWeeklyHoursSaved:
      executive.productivity.measuredWeeklyHoursSaved,
    fteAnnualWorkingHours: executive.productivity.fteAnnualWorkingHours,
  };
  const baselineWeeklyHoursSaved =
    productivity.baselinePeople *
    productivity.baselineDailyHoursPerPerson *
    productivity.workdaysPerWeek;
  const baselineAnnualHoursSaved =
    baselineWeeklyHoursSaved * productivity.workingWeeksPerYear;
  const measuredAnnualHoursSaved =
    productivity.measuredWeeklyHoursSaved * productivity.workingWeeksPerYear;
  const baselineWorkingDaysSaved = Math.round(
    baselineAnnualHoursSaved / productivity.workdayHours,
  );
  const measuredWorkingDaysSaved = Math.round(
    measuredAnnualHoursSaved / productivity.workdayHours,
  );
  const annualShiftHoursPerPerson = productivity.fteAnnualWorkingHours;
  const baselineFteYearsSaved = (
    baselineAnnualHoursSaved / annualShiftHoursPerPerson
  ).toFixed(1);
  const measuredFteYearsSaved = (
    measuredAnnualHoursSaved / annualShiftHoursPerPerson
  ).toFixed(1);
  const redEngagementLines = redEngagements.map(
    (project, index) =>
      `${index + 1}. ${project.name} (${project.sprId}) - ${project.overdueReviews} overdue SRs, ${project.criticalOpen} critical open findings, ${project.pendingExtensions} pending extensions, ${project.allocatedHours}h allocated, ${project.variance >= 0 ? "+" : ""}${project.variance}h variance.`,
  );
  const unassignedReviewLines = unassignedReviews.slice(0, 10).map(
    (review) =>
      `${review.project.name} | ${review.project.sprId ?? "SPR pending"} | ${review.srId ?? "SR pending"} - ${review.status}, due ${formatDate(review.dueDate)}.`,
  );
  const rescheduleAndCancellationLines = [
    ...rescheduledReviews.slice(0, 8).map(
      (review) =>
        `Rescheduled: ${review.project.name} | ${review.srId ?? "SR pending"} - requested ${formatDate(review.requestedStartDate)}, actual ${formatDate(review.actualStartDate)}.`,
    ),
    ...canceledProjects.slice(0, 6).map(
      (project) =>
        `Canceled project: ${project.name} | ${project.sprId ?? "SPR pending"} | ${project.status}.`,
    ),
    ...canceledReviews.slice(0, 6).map(
      (review) =>
        `Canceled review: ${review.project.name} | ${review.srId ?? "SR pending"} | ${review.status}.`,
    ),
  ];
  const extensionLines = extensionRequests.slice(0, 10).map(
    (extension) =>
      `${extension.review.project.name} | ${extension.review.srId ?? "SR pending"} - requested until ${formatDate(extension.requestedUntil)}; ${extension.reason.replace(/[.\s]+$/, "")}.`,
  );

  const report = `# Atomix Executive Delivery Report

Generated: ${new Date().toLocaleString()}

## KPI Snapshot
- Active SRs: ${reportMetrics.activeReviews}
- Allocated hours: ${reportMetrics.allocatedHours}h across active SR assignments
- Capacity utilization: ${reportMetrics.capacityUtilization}% of reviewer capacity
- Variance: ${reportMetrics.variance >= 0 ? "+" : ""}${reportMetrics.variance}h against expected delivery baseline
- Monthly allocation run-rate: ${reportMetrics.monthHours}h (4.2-week planning estimate)
- Red engagements: ${reportMetrics.redEngagements}
- Unassigned reviews: ${reportMetrics.unassignedReviews}
- Extensions needed: ${reportMetrics.extensionRequests}
- Rescheduled reviews: ${reportMetrics.rescheduledReviews}
- Canceled projects: ${reportMetrics.canceledProjects}
- Canceled reviews: ${reportMetrics.canceledReviews}

## Operational Signals
- Historical allocation trend: Not available until dated time-entry history is recorded.
- Capacity utilization signal: ${reportMetrics.capacityUtilization >= 80 ? "high load" : reportMetrics.capacityUtilization >= 50 ? "balanced load" : "under-allocated load"} across available reviewer capacity.
- Variance signal: ${reportMetrics.variance > 0 ? "over baseline; review overrun, surge demand, or estimation drift." : reportMetrics.variance < 0 ? "under baseline; review unassigned work or under-allocation." : "on baseline."}
- Exception trend: ${reportMetrics.redEngagements} red engagements, ${reportMetrics.extensionRequests} extension requests, ${reportMetrics.rescheduledReviews} reschedules.

## Productivity And Business Value
- Productivity source: ${productivitySource === "live" ? "Observed database volumes multiplied by saved-time assumptions" : "Saved planning scenario assumptions"}.
- Estimated workflow run-rate: ${productivity.measuredWeeklyHoursSaved} hrs/week from ${productivitySource === "live" ? "observed workflow volumes" : "saved workflow-volume assumptions"} annualizes to ${measuredAnnualHoursSaved.toLocaleString()} hrs/year, or ${measuredWorkingDaysSaved.toLocaleString()} ${productivity.workdayHours}-hour person-days.
- Important measurement note: this is not stopwatch-tracked realized savings; it is calculated from current Atomix workflow volume multiplied by conservative time-saved assumptions per workflow item.
- Estimated current capacity: ${measuredFteYearsSaved} FTE-year equivalent using ${annualShiftHoursPerPerson.toLocaleString()} hrs/person/year.
- Full-adoption scenario: ${productivity.baselinePeople} people x ${productivity.baselineDailyHoursPerPerson} hr/day x ${productivity.workdaysPerWeek} days/week x ${productivity.workingWeeksPerYear} weeks = ${baselineAnnualHoursSaved.toLocaleString()} hrs/year, or ${baselineWorkingDaysSaved.toLocaleString()} ${productivity.workdayHours}-hour person-days.
- Full-adoption capacity: ${baselineFteYearsSaved} FTE-years if the ${productivitySource === "live" ? "observed-user run rate" : "saved adoption scenario"} is achieved.
- Important framing: the ${baselineWorkingDaysSaved.toLocaleString()} person-day number is a scenario model, not claimed realized savings, headcount reduction, or already-delivered capacity.
- Value beyond FTE: Atomix also targets review quality, faster evidence readiness, fewer missed controls, better SLA governance, reusable institutional knowledge, and reduced rework.

## Red Engagements
${redEngagementLines.map((line, index) => `${index + 1}. ${line.replace(/^\d+\.\s*/, "")}`).join("\n") || "- No red engagements in the current portfolio snapshot."}

## Unassigned Reviews
${unassignedReviewLines.map((line) => `- ${line}`).join("\n") || "- No unassigned active reviews."}

## Reschedules And Cancellations
${rescheduleAndCancellationLines.map((line) => `- ${line}`).join("\n") || "- No reschedules or cancellations detected."}

## Extension Queue
${extensionLines.map((line) => `- ${line}`).join("\n") || "- No pending extension requests."}
`;

  return Response.json({
    report,
    summary: {
      projects: executive.summary.projects,
      ...reportMetrics,
      operationalDataSource: "live",
      productivitySource,
    },
  });
}
