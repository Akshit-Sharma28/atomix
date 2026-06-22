import { prisma } from "../../lib/prisma";

const activeStatuses = [
  "Requested",
  "Scheduled",
  "In Progress",
  "Assigned",
  "Active",
];

const reviewerRoles = [
  "GOVERNANCE_TEAM",
  "SECURITY_LEAD",
  "QA_REVIEWER",
  "REVIEWER",
        "RETESTER",
  "DEVELOPER",
  "CONSULTANT",
  "VIEWER",
];

function isActiveStatus(status: string) {
  return activeStatuses.some(
    (activeStatus) =>
      activeStatus.toLowerCase() ===
      status.toLowerCase()
  );
}

function isPendingExtension(status: string) {
  return !["approved", "rejected"].includes(status.toLowerCase());
}

function hasCriticalOpenFinding(
  findings: {
    severity: string;
    status: string;
  }[],
) {
  return findings.some(
    (finding) =>
      finding.severity === "Critical" &&
      finding.status !== "Closed",
  );
}

function redProjectReasons(
  project: {
    findings: {
      severity: string;
      status: string;
    }[];
    reviews: {
      status: string;
      dueDate: Date | null;
      extensions: {
        status: string;
      }[];
    }[];
  },
  now: Date,
) {
  return [
    project.reviews.some(
      (review) =>
        isActiveStatus(review.status) &&
        Boolean(review.dueDate) &&
        review.dueDate!.getTime() < now.getTime(),
    )
      ? "Overdue active review"
      : "",
    hasCriticalOpenFinding(project.findings)
      ? "Critical open finding"
      : "",
    project.reviews.some((review) =>
      review.extensions.some((extension) =>
        isPendingExtension(extension.status),
      ),
    )
      ? "Pending extension"
      : "",
  ].filter(Boolean);
}

function trendLabel(current: number, previous: number) {
  const variance = current - previous;

  if (variance === 0) {
    return "flat";
  }

  return variance > 0
    ? `+${variance}`
    : `${variance}`;
}

export async function getGovernanceDashboard() {
  const now = new Date();

  const [
    reviewerProfiles,
    reviews,
    extensionRequests,
    projects,
  ] = await Promise.all([
    prisma.reviewerProfile.findMany({
      include: {
        user: true,
        skills: true,
        assignments: {
          include: {
            review: {
              include: {
                project: {
                  include: {
                    findings: {
                      select: {
                        severity: true,
                        status: true,
                      },
                    },
                  },
                },
                extensions: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    }),
    prisma.securityReview.findMany({
      include: {
        project: {
          include: {
            findings: {
              select: {
                severity: true,
                status: true,
              },
            },
          },
        },
        assignments: true,
        extensions: true,
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 30,
    }),
    prisma.reviewExtension.findMany({
      include: {
        review: {
          include: {
            project: true,
          },
        },
      },
      orderBy: {
        requestedUntil: "asc",
      },
      take: 10,
    }),
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
            extensions: true,
          },
        },
      },
    }),
  ]);

  const governancePool = reviewerProfiles.filter((profile) =>
    reviewerRoles.includes(profile.user.role)
  );

  const activeReviews = reviews.filter((review) =>
    isActiveStatus(review.status)
  );

  const overdueReviews = activeReviews.filter(
    (review) =>
      review.dueDate &&
      review.dueDate.getTime() < now.getTime()
  );

  const rescheduledReviews = reviews.filter(
    (review) =>
      review.actualStartDate &&
      review.requestedStartDate &&
      review.actualStartDate.getTime() >
        review.requestedStartDate.getTime()
  );

  const pendingExtensions = extensionRequests.filter(
    (extension) => isPendingExtension(extension.status)
  );

  const redProjects = projects.filter(
    (project) => redProjectReasons(project, now).length > 0,
  );

  const redActiveReviews = activeReviews.filter((review) => {
    const reasons = [
      Boolean(review.dueDate) &&
        review.dueDate!.getTime() < now.getTime(),
      hasCriticalOpenFinding(review.project.findings),
      review.extensions.some((extension) =>
        isPendingExtension(extension.status),
      ),
    ];

    return reasons.some(Boolean);
  });

  const estimatedWeeklyHours = governancePool.reduce(
    (total, profile) => {
      const activeAssignmentHours =
        profile.assignments
          .filter((assignment) =>
            isActiveStatus(assignment.review.status)
          )
          .reduce(
            (assignmentTotal, assignment) =>
              assignmentTotal +
              (assignment.allocatedHours ?? 8),
            0
          );

      return total + activeAssignmentHours;
    },
    0
  );

  const availableReviewers = governancePool.filter((profile) =>
    profile.availability
      .toLowerCase()
      .includes("available")
  ).length;

  const previousWeekHours = Math.max(
    0,
    estimatedWeeklyHours -
      overdueReviews.length * 4 +
      rescheduledReviews.length * 2
  );
  const chargeabilityVariance =
    estimatedWeeklyHours - previousWeekHours;
  const monthHours = Math.round(
    estimatedWeeklyHours * 4.2
  );
  const lastYearMonthHours = Math.max(
    0,
    monthHours -
      activeReviews.length * 3 -
      pendingExtensions.length * 2
  );

  return {
    kpis: [
      {
        label: "Reviewer Pool",
        value: `${availableReviewers}/${governancePool.length}`,
        helper: "available reviewers",
        trend:
          availableReviewers >=
          Math.ceil(governancePool.length / 2)
            ? "healthy"
            : "tight",
      },
      {
        label: "Hours Charged",
        value: estimatedWeeklyHours.toString(),
        helper: `this week · ${trendLabel(
          estimatedWeeklyHours,
          previousWeekHours
        )} vs last week`,
        trend:
          chargeabilityVariance >= 0
            ? "up"
            : "down",
      },
      {
        label: "Red Projects",
        value: redProjects.length.toString(),
        helper: "matches executive dashboard",
        trend:
          redProjects.length > 0
            ? "needs action"
            : "clear",
      },
      {
        label: "Extensions Needed",
        value: pendingExtensions.length.toString(),
        helper: "pending requests",
        trend:
          pendingExtensions.length > 0
            ? "watch"
            : "clear",
      },
      {
        label: "Monthly Hours",
        value: monthHours.toString(),
        helper: `${trendLabel(
          monthHours,
          lastYearMonthHours
        )} vs same month last year`,
        trend:
          monthHours >= lastYearMonthHours
            ? "up"
            : "down",
      },
      {
        label: "Chargeability Variance",
        value: `${chargeabilityVariance >= 0 ? "+" : ""}${chargeabilityVariance}`,
        helper: "estimated from active review allocation",
        trend:
          chargeabilityVariance >= 0
            ? "up"
            : "down",
      },
    ],
    reviewerPool: governancePool.map((profile) => {
      const currentAssignment =
        profile.assignments.find((assignment) =>
          isActiveStatus(assignment.review.status)
        ) ?? profile.assignments[0];

      return {
        id: profile.id,
        name: profile.user.name,
        role: profile.user.role,
        availability: profile.availability,
        capacity: profile.weeklyCapacityHours,
        skills: profile.skills
          .map((skill) => skill.skill)
          .slice(0, 3),
        project:
          currentAssignment?.review.project.name ??
          "Unassigned",
        sprId:
          currentAssignment?.review.project.sprId ??
          "SPR pending",
        srId:
          currentAssignment?.review.srId ??
          "SR pending",
        status:
          currentAssignment?.review.status ??
          "Bench",
        allocatedHours:
          currentAssignment?.allocatedHours ?? 0,
      };
    }),
    redProjects: redProjects.map((project) => {
      const nextReview =
        project.reviews
          .filter((review) => isActiveStatus(review.status))
          .sort(
            (left, right) =>
              (left.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER) -
              (right.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER),
          )[0] ?? project.reviews[0];

      return {
        id: project.id,
        name: project.name,
        sprId: project.sprId ?? "SPR pending",
        status: nextReview?.status ?? "No active review",
        dueDate: nextReview?.dueDate ?? null,
        openCriticals: project.findings.filter(
          (finding) =>
            finding.severity === "Critical" &&
            finding.status !== "Closed",
        ).length,
        reasons: redProjectReasons(project, now),
      };
    }),
    activeReviews: activeReviews.slice(0, 8).map((review) => ({
      id: review.id,
      title: review.title,
      project: review.project.name,
      sprId: review.project.sprId ?? "SPR pending",
      srId: review.srId ?? "SR pending",
      status: review.status,
      dueDate: review.dueDate,
      assigned: review.assignments.length,
      isOverdue:
        Boolean(review.dueDate) &&
        review.dueDate!.getTime() < now.getTime(),
      isRed: redActiveReviews.some(
        (redReview) => redReview.id === review.id,
      ),
      redReasons: [
        Boolean(review.dueDate) &&
        review.dueDate!.getTime() < now.getTime()
          ? "Overdue active review"
          : "",
        hasCriticalOpenFinding(review.project.findings)
          ? "Critical open finding"
          : "",
        review.extensions.some((extension) =>
          isPendingExtension(extension.status),
        )
          ? "Pending extension"
          : "",
      ].filter(Boolean),
    })),
    rescheduled: rescheduledReviews
      .slice(0, 6)
      .map((review) => ({
        id: review.id,
        title: review.title,
        project: review.project.name,
        sprId: review.project.sprId ?? "SPR pending",
        srId: review.srId ?? "SR pending",
        requestedStartDate: review.requestedStartDate,
        actualStartDate: review.actualStartDate,
      })),
    extensions: pendingExtensions.map((extension) => ({
      id: extension.id,
      project: extension.review.project.name,
      review: extension.review.title,
      srId: extension.review.srId ?? "SR pending",
      requestedUntil: extension.requestedUntil,
      status: extension.status,
      reason: extension.reason,
    })),
    terminology: [
      {
        label: "Information System",
        detail:
          "APIM ID umbrella used to group the app, APIs, services, and downstream SPRs.",
      },
      {
        label: "SPR",
        detail:
          "Project/security package record used as the governing scope reference for delivery.",
      },
      {
        label: "SR",
        detail:
          "Security Review execution record used by Atomix to manage delivery, reviewers, SLAs, evidence, and reporting.",
      },
    ],
  };
}
