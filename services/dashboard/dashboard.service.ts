import { prisma } from "../../lib/prisma";

const activeReviewStatuses = [
  "Requested",
  "Scheduled",
  "In Progress",
  "Assigned",
  "Active",
];

function activeReviewWhere() {
  return {
    status: {
      in: activeReviewStatuses,
    },
  };
}

function normalizeRole(role?: string | null) {
  if (role === "SECURITY_LEAD") {
    return "GOVERNANCE_TEAM";
  }

  if (role === "DEVELOPER" || role === "VIEWER" || role === "CONSULTANT") {
    return "REVIEWER";
  }

  return role ?? "REVIEWER";
}

export async function getDashboardMetrics({
  role,
  userId,
}: {
  role?: string | null;
  userId?: string | null;
} = {}) {
  const [
    total,
    critical,
    high,
    medium,
    low,
    open,
    closed,
    roleSummary,
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

    getRoleDashboardSummary({
      role,
      userId,
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
    role: roleSummary,
  };
}

async function getRoleDashboardSummary({
  role,
  userId,
}: {
  role?: string | null;
  userId?: string | null;
}) {
  const normalizedRole = normalizeRole(role);
  const now = new Date();
  const dueSoon = new Date(now);
  dueSoon.setDate(now.getDate() + 7);

  if (normalizedRole === "ADMIN") {
    const [
      users,
      activeProjects,
      activeReviews,
      openFindings,
      pendingExtensions,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          isActive: true,
        },
      }),
      prisma.project.count({
        where: {
          status: {
            notIn: ["Closed", "Cancelled"],
          },
        },
      }),
      prisma.securityReview.count({
        where: activeReviewWhere(),
      }),
      prisma.finding.count({
        where: {
          status: {
            not: "Closed",
          },
        },
      }),
      prisma.reviewExtension.count({
        where: {
          status: {
            notIn: ["Approved", "Rejected"],
          },
        },
      }),
    ]);

    return {
      title: "Admin Control Dashboard",
      description:
        "Platform-wide identity, portfolio, review, and exception health.",
      cards: [
        { title: "Active Users", value: users, variant: "default" },
        { title: "Active SPRs", value: activeProjects, variant: "open" },
        { title: "Active SRs", value: activeReviews, variant: "high" },
        { title: "Open Findings", value: openFindings, variant: "critical" },
        { title: "Extensions", value: pendingExtensions, variant: "closed" },
      ],
    };
  }

  if (normalizedRole === "GOVERNANCE_TEAM") {
    const [
      availableReviewers,
      activeReviews,
      unassignedReviews,
      overdueReviews,
      pendingExtensions,
    ] = await Promise.all([
      prisma.reviewerProfile.count({
        where: {
          availability: {
            contains: "Available",
            mode: "insensitive",
          },
        },
      }),
      prisma.securityReview.count({
        where: activeReviewWhere(),
      }),
      prisma.securityReview.count({
        where: {
          ...activeReviewWhere(),
          assignments: {
            none: {},
          },
        },
      }),
      prisma.securityReview.count({
        where: {
          ...activeReviewWhere(),
          dueDate: {
            lt: now,
          },
        },
      }),
      prisma.reviewExtension.count({
        where: {
          status: {
            notIn: ["Approved", "Rejected"],
          },
        },
      }),
    ]);

    return {
      title: "Governance Dashboard",
      description:
        "Reviewer pool, unassigned work, overdue reviews, and extension pressure.",
      cards: [
        { title: "Available Reviewers", value: availableReviewers, variant: "closed" },
        { title: "Active SRs", value: activeReviews, variant: "open" },
        { title: "Unassigned", value: unassignedReviews, variant: "high" },
        { title: "Overdue", value: overdueReviews, variant: "critical" },
        { title: "Extensions", value: pendingExtensions, variant: "default" },
      ],
    };
  }

  if (normalizedRole === "EXECUTIVE") {
    const [projects, activeReviews, criticalOpen, overdueReviews] =
      await Promise.all([
        prisma.project.count(),
        prisma.securityReview.count({
          where: activeReviewWhere(),
        }),
        prisma.finding.count({
          where: {
            severity: "Critical",
            status: {
              not: "Closed",
            },
          },
        }),
        prisma.securityReview.count({
          where: {
            ...activeReviewWhere(),
            dueDate: {
              lt: now,
            },
          },
        }),
      ]);

    return {
      title: "Executive Snapshot",
      description:
        "Bird's-eye delivery, critical exposure, and overdue SR signals.",
      cards: [
        { title: "Portfolio", value: projects, variant: "default" },
        { title: "Active SRs", value: activeReviews, variant: "open" },
        { title: "Critical Open", value: criticalOpen, variant: "critical" },
        { title: "Overdue SRs", value: overdueReviews, variant: "high" },
        { title: "Signal", value: overdueReviews + criticalOpen, variant: "closed" },
      ],
    };
  }

  if (normalizedRole === "PROJECT_MANAGER") {
    const managedProjectWhere = userId
      ? {
          projectManagerId: userId,
        }
      : {};
    const [
      managedProjects,
      activeReviews,
      openFindings,
      dueSoonReviews,
      pendingRetests,
    ] = await Promise.all([
      prisma.project.count({
        where: managedProjectWhere,
      }),
      prisma.securityReview.count({
        where: {
          ...activeReviewWhere(),
          project: managedProjectWhere,
        },
      }),
      prisma.finding.count({
        where: {
          status: {
            not: "Closed",
          },
          project: managedProjectWhere,
        },
      }),
      prisma.securityReview.count({
        where: {
          ...activeReviewWhere(),
          dueDate: {
            gte: now,
            lte: dueSoon,
          },
          project: managedProjectWhere,
        },
      }),
      prisma.securityReview.count({
        where: {
          type: {
            contains: "RETEST",
            mode: "insensitive",
          },
          project: managedProjectWhere,
        },
      }),
    ]);

    return {
      title: "Project Manager Dashboard",
      description:
        "Assigned SPRs, active reviews, open findings, due-soon work, and retest readiness.",
      cards: [
        { title: "Assigned SPRs", value: managedProjects, variant: "default" },
        { title: "Active SRs", value: activeReviews, variant: "open" },
        { title: "Open Findings", value: openFindings, variant: "critical" },
        { title: "Due Soon", value: dueSoonReviews, variant: "high" },
        { title: "Retests", value: pendingRetests, variant: "closed" },
      ],
    };
  }

  if (normalizedRole === "QA_REVIEWER") {
    const [
      qaAssignments,
      peerReviews,
      activeReviews,
      openFindings,
      dueSoonReviews,
    ] = await Promise.all([
      prisma.reviewerAssignment.count({
        where: {
          userId: userId ?? undefined,
          role: {
            contains: "QA",
            mode: "insensitive",
          },
        },
      }),
      prisma.reviewerAssignment.count({
        where: {
          userId: userId ?? undefined,
          role: {
            contains: "Peer",
            mode: "insensitive",
          },
        },
      }),
      prisma.securityReview.count({
        where: {
          ...activeReviewWhere(),
          assignments: {
            some: {
              userId: userId ?? undefined,
            },
          },
        },
      }),
      prisma.finding.count({
        where: {
          status: {
            not: "Closed",
          },
          review: {
            assignments: {
              some: {
                userId: userId ?? undefined,
              },
            },
          },
        },
      }),
      prisma.securityReview.count({
        where: {
          ...activeReviewWhere(),
          dueDate: {
            gte: now,
            lte: dueSoon,
          },
          assignments: {
            some: {
              userId: userId ?? undefined,
            },
          },
        },
      }),
    ]);

    return {
      title: "QA Reviewer Dashboard",
      description:
        "Peer-review queue, assigned QA checks, evidence quality, and due-soon reviews.",
      cards: [
        { title: "QA Assignments", value: qaAssignments, variant: "default" },
        { title: "Peer Reviews", value: peerReviews, variant: "open" },
        { title: "Active SRs", value: activeReviews, variant: "high" },
        { title: "Open Findings", value: openFindings, variant: "critical" },
        { title: "Due Soon", value: dueSoonReviews, variant: "closed" },
      ],
    };
  }

  if (normalizedRole === "ENGAGEMENT_MANAGER") {
    const [
      activeProjects,
      activeReviews,
      overdueReviews,
      completedReviews,
      pendingExtensions,
    ] = await Promise.all([
      prisma.project.count({
        where: {
          status: {
            notIn: ["Closed", "Cancelled"],
          },
        },
      }),
      prisma.securityReview.count({
        where: activeReviewWhere(),
      }),
      prisma.securityReview.count({
        where: {
          ...activeReviewWhere(),
          dueDate: {
            lt: now,
          },
        },
      }),
      prisma.securityReview.count({
        where: {
          status: {
            in: ["Completed", "Closed"],
          },
        },
      }),
      prisma.reviewExtension.count({
        where: {
          status: {
            notIn: ["Approved", "Rejected"],
          },
        },
      }),
    ]);

    return {
      title: "Engagement Manager Dashboard",
      description:
        "Delivery status, overdue SRs, completion movement, and extension requests.",
      cards: [
        { title: "Active SPRs", value: activeProjects, variant: "default" },
        { title: "Active SRs", value: activeReviews, variant: "open" },
        { title: "Overdue", value: overdueReviews, variant: "critical" },
        { title: "Completed", value: completedReviews, variant: "closed" },
        { title: "Extensions", value: pendingExtensions, variant: "high" },
      ],
    };
  }

  const [assignedReviews, assignedFindings, dueSoonReviews, completedReviews] =
    await Promise.all([
      prisma.securityReview.count({
        where: {
          ...activeReviewWhere(),
          assignments: {
            some: {
              userId: userId ?? undefined,
            },
          },
        },
      }),
      prisma.finding.count({
        where: {
          ownerId: userId ?? undefined,
          status: {
            not: "Closed",
          },
        },
      }),
      prisma.securityReview.count({
        where: {
          ...activeReviewWhere(),
          dueDate: {
            gte: now,
            lte: dueSoon,
          },
          assignments: {
            some: {
              userId: userId ?? undefined,
            },
          },
        },
      }),
      prisma.securityReview.count({
        where: {
          status: {
            in: ["Completed", "Closed"],
          },
          assignments: {
            some: {
              userId: userId ?? undefined,
            },
          },
        },
      }),
    ]);

  return {
    title: "Reviewer Dashboard",
    description:
      "Your assigned SRs, owned findings, upcoming due dates, and completed review work.",
    cards: [
      { title: "My Active SRs", value: assignedReviews, variant: "open" },
      { title: "My Findings", value: assignedFindings, variant: "critical" },
      { title: "Due Soon", value: dueSoonReviews, variant: "high" },
      { title: "Completed", value: completedReviews, variant: "closed" },
      { title: "Focus", value: assignedReviews + assignedFindings, variant: "default" },
    ],
  };
}
