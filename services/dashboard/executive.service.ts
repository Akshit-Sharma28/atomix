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

export type ProductivitySource = "scenario" | "live";

function startOfIsoWeek(date: Date) {
  const start = new Date(date);
  const day = start.getUTCDay() || 7;
  start.setUTCDate(start.getUTCDate() - day + 1);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function isOverdue(dueDate?: Date | null) {
  return Boolean(dueDate && dueDate.getTime() < Date.now());
}

function isActiveReviewStatus(status: string) {
  return [
    "Requested",
    "Scheduled",
    "In Progress",
    "Assigned",
    "Active",
  ].some(
    (activeStatus) =>
      activeStatus.toLowerCase() === status.toLowerCase(),
  );
}

function assignmentHours(review: {
  assignments: {
    allocatedHours: number | null;
  }[];
}) {
  return review.assignments.reduce(
    (total, assignment) => total + (assignment.allocatedHours ?? 0),
    0,
  );
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
  productivitySource = "scenario",
}: {
  sort?: ExecutiveSort;
  filter?: ExecutiveFilter;
  search?: string;
  productivitySource?: ProductivitySource;
}) {
  const [projects, retestGovernance, savedProductivitySettings, productivityUsers] = await Promise.all([
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
            assignments: {
              include: {
                user: {
                  select: { reviewerPool: true },
                },
                reviewerProfile: {
                  include: {
                    user: {
                      select: { reviewerPool: true },
                    },
                  },
                },
              },
            },
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
    prisma.executiveProductivitySetting.findUnique({
      where: { id: "default" },
    }),
    prisma.user.findMany({
      select: { createdAt: true, isActive: true },
    }),
  ]);

  const rows = projects.map((project) => {
    const activeReviews = project.reviews.filter(
      (review) => isActiveReviewStatus(review.status),
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
    const allocatedHours = activeReviews.reduce(
      (total, review) => total + assignmentHours(review),
      0,
    );
    const expectedHours = activeReviews.length * 16;
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
  const activeReviewCount = rows.reduce(
    (total, row) => total + row.activeReviews,
    0,
  );
  const overdueReviewCount = rows.reduce(
    (total, row) => total + row.overdueReviews,
    0,
  );
  const productivitySettings = savedProductivitySettings ?? {
    id: "default",
    adoptionUsers: 100,
    hoursSavedPerUserPerDay: 1,
    newReviewsPerWeek: 25,
    dedicatedPoolShare: 0.5,
    retestRate: 0.2,
    dedicatedReviewsPerWeek: 13,
    augmentationReviewsPerWeek: 12,
    peerReviewsPerWeek: 25,
    retestsPerWeek: 5,
    lastWeekUsers: 100,
    lastWeekDedicatedReviews: 12,
    lastWeekAugmentationReviews: 11,
    lastWeekPeerReviews: 23,
    lastWeekRetests: 4,
    lastYearUsers: 90,
    lastYearDedicatedReviews: 10,
    lastYearAugmentationReviews: 10,
    lastYearPeerReviews: 20,
    lastYearRetests: 4,
    validatorHoursPerReview: 0.5,
    reviewerHoursPerReview: 1.5,
    peerReviewerHoursPerReview: 0.75,
    governanceHoursPerReview: 0.6,
    retesterHoursPerReview: 0.75,
    workdayHours: 9,
    workdaysPerWeek: 5,
    workingWeeksPerYear: 52,
    fteAnnualWorkingHours: 2025,
    updatedAt: null,
    updatedBy: null,
  };
  const now = new Date();
  const thisWeekStart = startOfIsoWeek(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7);
  const lastYearStart = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1));
  const lastYearEnd = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const allReviews = projects.flatMap((project) => project.reviews);
  const liveVolumes = (start: Date, end: Date, weekDivisor = 1) => {
    const reviews = allReviews.filter(
      (review) => review.createdAt >= start && review.createdAt < end,
    );
    const deliveryReviews = reviews.filter(
      (review) => !review.type.toLowerCase().includes("retest"),
    );
    const poolForReview = (review: (typeof deliveryReviews)[number]) => {
      const assignment = review.assignments.find(
        (item) => !/peer|qa|retest/i.test(item.role),
      );
      return assignment?.user?.reviewerPool ??
        assignment?.reviewerProfile?.user.reviewerPool ??
        null;
    };
    const peerReviewIds = new Set(
      allReviews.flatMap((review) =>
        review.assignments
          .filter(
            (assignment) =>
              assignment.createdAt >= start &&
              assignment.createdAt < end &&
              /peer|qa/i.test(assignment.role),
          )
          .map(() => review.id),
      ),
    );
    return {
      users:
        productivityUsers.filter((user) => user.isActive && user.createdAt < end).length,
      dedicated:
        deliveryReviews.filter((review) => poolForReview(review) === "Dedicated").length /
        weekDivisor,
      augmentation:
        deliveryReviews.filter((review) => poolForReview(review) !== "Dedicated").length /
        weekDivisor,
      peer: peerReviewIds.size / weekDivisor,
      retests:
        reviews.filter((review) => review.type.toLowerCase().includes("retest")).length /
        weekDivisor,
    };
  };
  const currentLiveVolumes = liveVolumes(thisWeekStart, now);
  const lastWeekLiveVolumes = liveVolumes(lastWeekStart, thisWeekStart);
  const lastYearLiveVolumes = liveVolumes(lastYearStart, lastYearEnd, 52);
  const dedicatedReviewsPerWeek = productivitySource === "live"
    ? currentLiveVolumes.dedicated
    : productivitySettings.dedicatedReviewsPerWeek;
  const augmentationReviewsPerWeek = productivitySource === "live"
    ? currentLiveVolumes.augmentation
    : productivitySettings.augmentationReviewsPerWeek;
  const newReviewsPerWeek = dedicatedReviewsPerWeek + augmentationReviewsPerWeek;
  const dedicatedPoolShare = newReviewsPerWeek > 0 ? dedicatedReviewsPerWeek / newReviewsPerWeek : 0;
  const augmentationPoolShare = newReviewsPerWeek > 0 ? augmentationReviewsPerWeek / newReviewsPerWeek : 0;
  const retestRate = newReviewsPerWeek > 0 ? productivitySettings.retestsPerWeek / newReviewsPerWeek : 0;
  const workdayHours = productivitySettings.workdayHours;
  const workdaysPerWeek = productivitySettings.workdaysPerWeek;
  const workweekHours = workdayHours * workdaysPerWeek;
  const workingWeeksPerYear = productivitySettings.workingWeeksPerYear;
  const annualWorkingDays = workdaysPerWeek * workingWeeksPerYear;
  const fteAnnualWorkingHours = productivitySettings.fteAnnualWorkingHours;
  const adoptionUsers = productivitySource === "live"
    ? currentLiveVolumes.users
    : productivitySettings.adoptionUsers;
  const adoptionHoursSavedPerUserPerDay = productivitySettings.hoursSavedPerUserPerDay;
  const adoptionDailyHoursSaved = adoptionUsers * adoptionHoursSavedPerUserPerDay;
  const adoptionWeeklyHoursSaved = adoptionDailyHoursSaved * workdaysPerWeek;
  const adoptionAnnualHoursSaved = adoptionWeeklyHoursSaved * workingWeeksPerYear;
  const adoptionMonthlyHoursSaved = adoptionAnnualHoursSaved / 12;
  const adoptionWorkingDaysSaved = adoptionAnnualHoursSaved / workdayHours;
  const adoptionWorkweeksSaved = adoptionAnnualHoursSaved / workweekHours;
  const adoptionFteEquivalent = adoptionAnnualHoursSaved / fteAnnualWorkingHours;
  const buildWorkflowModel = ({
    dedicated,
    augmentation,
    peer,
    retests,
  }: {
    dedicated: number;
    augmentation: number;
    peer: number;
    retests: number;
  }) => {
    const totalReviews = dedicated + augmentation;
    return [
    {
      workflow: "Demo Call / Scope Intake",
      role: "Reviewer (Demo Call Intake)",
      volume: totalReviews,
      hoursPerUnit: productivitySettings.validatorHoursPerReview,
      weeklyHoursSaved: totalReviews * productivitySettings.validatorHoursPerReview,
    },
    {
      workflow: "SR Control Review",
      role: "Dedicated Pool Reviewer",
      volume: dedicated,
      hoursPerUnit: productivitySettings.reviewerHoursPerReview,
      weeklyHoursSaved: dedicated * productivitySettings.reviewerHoursPerReview,
    },
    {
      workflow: "SR Control Review",
      role: "Augmentation Pool Reviewer",
      volume: augmentation,
      hoursPerUnit: productivitySettings.reviewerHoursPerReview,
      weeklyHoursSaved: augmentation * productivitySettings.reviewerHoursPerReview,
    },
    {
      workflow: "Peer Review Quality Gate",
      role: "Peer Reviewer",
      volume: peer,
      hoursPerUnit: productivitySettings.peerReviewerHoursPerReview,
      weeklyHoursSaved: peer * productivitySettings.peerReviewerHoursPerReview,
    },
    {
      workflow: "Governance Call / SLA Monitoring",
      role: "Governance Team",
      volume: totalReviews,
      hoursPerUnit: productivitySettings.governanceHoursPerReview,
      weeklyHoursSaved: totalReviews * productivitySettings.governanceHoursPerReview,
    },
    {
      workflow: "Retest Assignment",
      role: "Retester",
      volume: retests,
      hoursPerUnit: productivitySettings.retesterHoursPerReview,
      weeklyHoursSaved: retests * productivitySettings.retesterHoursPerReview,
    },
  ];
  };
  const weeklyProductivityByWorkflow = buildWorkflowModel({
    dedicated: dedicatedReviewsPerWeek,
    augmentation: augmentationReviewsPerWeek,
    peer: productivitySource === "live" ? currentLiveVolumes.peer : productivitySettings.peerReviewsPerWeek,
    retests: productivitySource === "live" ? currentLiveVolumes.retests : productivitySettings.retestsPerWeek,
  }).map((item) => ({
    ...item,
    annualHoursSaved: item.weeklyHoursSaved * workingWeeksPerYear,
    annualWorkingDaysSaved:
      (item.weeklyHoursSaved * workingWeeksPerYear) / workdayHours,
    workweekCapacityPercent: (item.weeklyHoursSaved / workweekHours) * 100,
  }));
  const measuredWeeklyHoursSaved = weeklyProductivityByWorkflow.reduce(
    (total, item) => total + item.weeklyHoursSaved,
    0,
  );
  const measuredAnnualHoursSaved =
    measuredWeeklyHoursSaved * workingWeeksPerYear;
  const comparisonFor = (period: "lastWeek" | "lastYear") => {
    const isLastWeek = period === "lastWeek";
    const liveBaseline = isLastWeek ? lastWeekLiveVolumes : lastYearLiveVolumes;
    const workflows = buildWorkflowModel({
      dedicated: productivitySource === "live" ? liveBaseline.dedicated : isLastWeek ? productivitySettings.lastWeekDedicatedReviews : productivitySettings.lastYearDedicatedReviews,
      augmentation: productivitySource === "live" ? liveBaseline.augmentation : isLastWeek ? productivitySettings.lastWeekAugmentationReviews : productivitySettings.lastYearAugmentationReviews,
      peer: productivitySource === "live" ? liveBaseline.peer : isLastWeek ? productivitySettings.lastWeekPeerReviews : productivitySettings.lastYearPeerReviews,
      retests: productivitySource === "live" ? liveBaseline.retests : isLastWeek ? productivitySettings.lastWeekRetests : productivitySettings.lastYearRetests,
    });
    const weeklyHours = workflows.reduce((sum, item) => sum + item.weeklyHoursSaved, 0);
    const currentUsers = adoptionUsers;
    const baselineUsers = productivitySource === "live"
      ? liveBaseline.users
      : isLastWeek ? productivitySettings.lastWeekUsers : productivitySettings.lastYearUsers;
    const adoptionHours = baselineUsers * adoptionHoursSavedPerUserPerDay * workdaysPerWeek;
    return {
      users: baselineUsers,
      adoptionWeeklyHours: adoptionHours,
      operationalWeeklyHours: weeklyHours,
      operationalAnnualHours: weeklyHours * workingWeeksPerYear,
      userChangePercent: baselineUsers > 0 ? ((currentUsers - baselineUsers) / baselineUsers) * 100 : null,
      workflows,
      volumes: liveBaseline,
    };
  };
  const comparisons = {
    lastWeek: comparisonFor("lastWeek"),
    lastYear: comparisonFor("lastYear"),
  };

  return {
    summary: {
      projects: rows.length,
      redProjects: rows.filter((row) => row.red).length,
      activeReviews: activeReviewCount,
      overdueReviews: overdueReviewCount,
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
    productivity: {
      source: productivitySource,
      liveVolumes: {
        current: currentLiveVolumes,
        lastWeek: lastWeekLiveVolumes,
        lastYearWeeklyAverage: lastYearLiveVolumes,
      },
      settings: productivitySettings,
      newReviewsPerWeek,
      dedicatedReviewsPerWeek,
      augmentationReviewsPerWeek,
      dedicatedPoolShare,
      augmentationPoolShare,
      retestRate,
      comparisons,
      workdayHours,
      workdaysPerWeek,
      workweekHours,
      workingWeeksPerYear,
      annualWorkingDays,
      fteAnnualWorkingHours,
      adoptionUsers,
      adoptionHoursSavedPerUserPerDay,
      adoptionDailyHoursSaved,
      adoptionWeeklyHoursSaved,
      adoptionMonthlyHoursSaved,
      adoptionAnnualHoursSaved,
      adoptionWorkingDaysSaved,
      adoptionWorkweeksSaved,
      adoptionFteEquivalent,
      measuredWeeklyHoursSaved,
      measuredAnnualHoursSaved,
      measuredWorkingDaysSaved: Math.round(measuredAnnualHoursSaved / workdayHours),
      measuredFteYearsSaved:
        Math.round((measuredAnnualHoursSaved / fteAnnualWorkingHours) * 10) / 10,
      measuredFteYearsSavedLabel:
        (measuredAnnualHoursSaved / fteAnnualWorkingHours).toFixed(1),
      workflows: weeklyProductivityByWorkflow,
    },
    rows: filteredRows,
  };
}
