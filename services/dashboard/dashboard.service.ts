import { prisma } from "../../lib/prisma";

const activeReviewStatuses = [
  "Requested",
  "Scheduled",
  "In Progress",
  "Assigned",
  "Active",
];

type DashboardWorkspaceItem = {
  label: string;
  value: string;
  meta?: string;
  href?: string;
  tone?: "default" | "good" | "warn" | "danger";
};

type DashboardWorkspaceSection = {
  title: string;
  subtitle: string;
  items: DashboardWorkspaceItem[];
};

type DashboardWorkspaceAction = {
  label: string;
  href: string;
  detail: string;
};

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

function formatDate(value?: Date | null) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(value);
}

function reviewHref(reviewId: string) {
  return `/reviews/${reviewId}`;
}

function mapReviewItem(review: any): DashboardWorkspaceItem {
  const assignees =
    review.assignments
      ?.map((assignment: any) => assignment.user?.name)
      .filter(Boolean)
      .join(", ") || "Needs assignment";

  return {
    label: review.srId ?? review.title,
    value: review.status,
    meta: `${review.project?.sprId ?? review.project?.name ?? "Portfolio"} · ${
      review.project?.name ?? review.title
    } · Due ${formatDate(review.dueDate)} · ${assignees}`,
    href: reviewHref(review.id),
    tone: review.dueDate && review.dueDate < new Date() ? "danger" : "default",
  };
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

export async function getDashboardWorkspace({
  role,
  userId,
}: {
  role?: string | null;
  userId?: string | null;
} = {}) {
  const normalizedRole = normalizeRole(role);
  const now = new Date();
  const dueSoon = new Date(now);
  dueSoon.setDate(now.getDate() + 7);

  const includeReviewContext = {
    project: true,
    assignments: {
      include: {
        user: true,
      },
    },
    extensions: true,
  };

  if (normalizedRole === "ADMIN") {
    const [unassigned, extensions, recentUsers] = await Promise.all([
      prisma.securityReview.findMany({
        where: {
          ...activeReviewWhere(),
          assignments: {
            none: {},
          },
        },
        include: includeReviewContext,
        orderBy: {
          dueDate: "asc",
        },
        take: 5,
      }),
      prisma.reviewExtension.findMany({
        where: {
          status: {
            notIn: ["Approved", "Rejected"],
          },
        },
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
        take: 5,
      }),
      prisma.user.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ]);

    return {
      actions: [
        {
          label: "Manage Users",
          href: "/users",
          detail: "Create, edit, reset, and deactivate platform users.",
        },
        {
          label: "Governance Portfolio",
          href: "/projects",
          detail: "Review information systems and SR history.",
        },
        {
          label: "Validator Workflow",
          href: "/workflow",
          detail: "Run intake, assignment, and scope workflows.",
        },
      ],
      sections: [
        {
          title: "Admin Attention Queue",
          subtitle: "Items that need platform owner action.",
          items: [
            ...unassigned.map(mapReviewItem),
            ...extensions.map((extension) => ({
              label: extension.review.srId ?? extension.review.title,
              value: "Extension requested",
              meta: `${extension.review.project.sprId ?? extension.review.project.name} · Until ${formatDate(extension.requestedUntil)}`,
              href: reviewHref(extension.review.id),
              tone: "warn" as const,
            })),
          ],
        },
        {
          title: "Identity Governance",
          subtitle: "Recently active user records for RBAC checks.",
          items: recentUsers.map((user) => ({
            label: user.name,
            value: user.role,
            meta: user.email,
            href: "/users",
            tone: "default" as const,
          })),
        },
      ],
    };
  }

  if (normalizedRole === "GOVERNANCE_TEAM") {
    const [unassigned, overdue, extensionRequests] = await Promise.all([
      prisma.securityReview.findMany({
        where: {
          ...activeReviewWhere(),
          assignments: {
            none: {},
          },
        },
        include: includeReviewContext,
        orderBy: {
          dueDate: "asc",
        },
        take: 6,
      }),
      prisma.securityReview.findMany({
        where: {
          ...activeReviewWhere(),
          dueDate: {
            lt: now,
          },
        },
        include: includeReviewContext,
        orderBy: {
          dueDate: "asc",
        },
        take: 6,
      }),
      prisma.reviewExtension.findMany({
        where: {
          status: {
            notIn: ["Approved", "Rejected"],
          },
        },
        include: {
          review: {
            include: {
              project: true,
            },
          },
        },
        take: 6,
      }),
    ]);

    return {
      actions: [
        {
          label: "Weekly Governance Call",
          href: "/reviewers/governance-call",
          detail: "Capture status, reschedules, cancellations, and extensions.",
        },
        {
          label: "Assign Reviewers",
          href: "/workflow",
          detail: "Match available reviewers, retesters, and QA reviewers.",
        },
        {
          label: "Retest Governance",
          href: "/retest-governance",
          detail: "Track ready-for-retest requests and reviewer capacity.",
        },
      ],
      sections: [
        {
          title: "Unassigned SRs",
          subtitle: "Work waiting for reviewer assignment.",
          items: unassigned.map(mapReviewItem),
        },
        {
          title: "Delivery Exceptions",
          subtitle: "Overdue work and extension requests.",
          items: [
            ...overdue.map(mapReviewItem),
            ...extensionRequests.map((extension) => ({
              label: extension.review.srId ?? extension.review.title,
              value: "Extension requested",
              meta: `${extension.review.project.name} · Until ${formatDate(extension.requestedUntil)}`,
              href: reviewHref(extension.review.id),
              tone: "warn" as const,
            })),
          ],
        },
      ],
    };
  }

  if (normalizedRole === "VALIDATOR") {
    const [pending, ready] = await Promise.all([
      prisma.securityReview.findMany({
        where: {
          status: {
            in: ["Requested", "Prerequisites Pending", "Blocked"],
          },
        },
        include: includeReviewContext,
        orderBy: {
          requestedStartDate: "asc",
        },
        take: 6,
      }),
      prisma.securityReview.findMany({
        where: {
          status: "Ready for Review",
        },
        include: includeReviewContext,
        take: 6,
      }),
    ]);

    return {
      actions: [
        {
          label: "Demo Call Agent",
          href: "/workflow/scope-call",
          detail: "Build a scope document from PM/app-team intake.",
        },
        {
          label: "Peer Review Agent",
          href: "/workflow/peer-review",
          detail: "Cross-check FEAD, BEAD, LLM FEAD, and scan evidence.",
        },
        {
          label: "DB Action Builder",
          href: "/workflow/command-center",
          detail: "Create governed records with structured forms.",
        },
      ],
      sections: [
        {
          title: "Prerequisite Queue",
          subtitle: "Reviews that need scope, access, evidence, or clarification.",
          items: pending.map(mapReviewItem),
        },
        {
          title: "Ready For Assignment",
          subtitle: "Validated reviews that can move into delivery.",
          items: ready.map(mapReviewItem),
        },
      ],
    };
  }

  if (normalizedRole === "EXECUTIVE") {
    const [overdue, criticalFindings, extensions] = await Promise.all([
      prisma.securityReview.findMany({
        where: {
          ...activeReviewWhere(),
          dueDate: {
            lt: now,
          },
        },
        include: includeReviewContext,
        take: 5,
      }),
      prisma.finding.findMany({
        where: {
          severity: "Critical",
          status: {
            not: "Closed",
          },
        },
        include: {
          project: true,
          review: true,
        },
        take: 5,
      }),
      prisma.reviewExtension.findMany({
        where: {
          status: {
            notIn: ["Approved", "Rejected"],
          },
        },
        include: {
          review: {
            include: {
              project: true,
            },
          },
        },
        take: 5,
      }),
    ]);

    return {
      actions: [
        {
          label: "Open Executive Dashboard",
          href: "/executive",
          detail: "View leadership trends, variance, and delivery signals.",
        },
        {
          label: "Download Executive Report",
          href: "/executive",
          detail: "Export hours, chargeability, variance, and exceptions.",
        },
      ],
      sections: [
        {
          title: "Leadership Signals",
          subtitle: "Only exceptions and decision points are surfaced here.",
          items: [
            ...overdue.map(mapReviewItem),
            ...extensions.map((extension) => ({
              label: extension.review.srId ?? extension.review.title,
              value: "Extension requested",
              meta: `${extension.review.project.name} · Until ${formatDate(extension.requestedUntil)}`,
              href: reviewHref(extension.review.id),
              tone: "warn" as const,
            })),
          ],
        },
        {
          title: "Critical Exposure",
          subtitle: "Open critical findings mapped to portfolio records.",
          items: criticalFindings.map((finding) => ({
            label: finding.title,
            value: finding.status,
            meta: `${finding.project.sprId ?? finding.project.name} · ${
              finding.review?.srId ?? "No SR"
            }`,
            href: finding.reviewId ? reviewHref(finding.reviewId) : "/projects",
            tone: "danger" as const,
          })),
        },
      ],
    };
  }

  if (normalizedRole === "PROJECT_MANAGER") {
    const projectWhere = userId
      ? {
          projectManagerId: userId,
        }
      : {};

    const [reviews, retests] = await Promise.all([
      prisma.securityReview.findMany({
        where: {
          ...activeReviewWhere(),
          project: projectWhere,
        },
        include: includeReviewContext,
        orderBy: {
          dueDate: "asc",
        },
        take: 6,
      }),
      prisma.securityReview.findMany({
        where: {
          project: projectWhere,
          type: {
            contains: "RETEST",
            mode: "insensitive",
          },
        },
        include: includeReviewContext,
        take: 6,
      }),
    ]);

    return {
      actions: [
        {
          label: "My Portfolio",
          href: "/projects",
          detail: "Track your mapped information systems and reviews.",
        },
        {
          label: "Retest Requests",
          href: "/retest-governance",
          detail: "Check fixes, access readiness, and retest state.",
        },
      ],
      sections: [
        {
          title: "My Active Reviews",
          subtitle: "SRs mapped to projects you manage.",
          items: reviews.map(mapReviewItem),
        },
        {
          title: "Retest Readiness",
          subtitle: "Retests connected to your project portfolio.",
          items: retests.map(mapReviewItem),
        },
      ],
    };
  }

  const assignmentRole =
    normalizedRole === "QA_REVIEWER"
      ? {
          contains: "QA",
          mode: "insensitive" as const,
        }
      : normalizedRole === "RETESTER"
        ? {
            contains: "Retester",
            mode: "insensitive" as const,
          }
        : undefined;

  const reviewWhere = {
    ...activeReviewWhere(),
    assignments: {
      some: {
        userId: userId ?? undefined,
        ...(assignmentRole
          ? {
              role: assignmentRole,
            }
          : {}),
      },
    },
  };

  const [assigned, dueSoonReviews, findings] = await Promise.all([
    prisma.securityReview.findMany({
      where: reviewWhere,
      include: includeReviewContext,
      orderBy: {
        dueDate: "asc",
      },
      take: 6,
    }),
    prisma.securityReview.findMany({
      where: {
        ...reviewWhere,
        dueDate: {
          gte: now,
          lte: dueSoon,
        },
      },
      include: includeReviewContext,
      take: 6,
    }),
    prisma.finding.findMany({
      where: {
        ownerId: userId ?? undefined,
        status: {
          not: "Closed",
        },
      },
      include: {
        project: true,
        review: true,
      },
      take: 6,
    }),
  ]);

  return {
    actions: [
      {
        label:
          normalizedRole === "QA_REVIEWER"
            ? "Open QA Queue"
            : normalizedRole === "RETESTER"
              ? "Open Retest Queue"
              : "Open My Reviews",
        href: "/my-findings",
        detail: "Work from assigned SRs and add review evidence.",
      },
      {
        label: "Peer Review Agent",
        href: "/workflow/peer-review",
        detail: "Cross-check scope, artifacts, controls, and scan evidence.",
      },
      {
        label: "Reviewer Copilot",
        href: "/workflow/reviewer-copilot",
        detail: "Run passive web checks and use LLM review prompt scenarios.",
      },
    ],
    sections: [
      {
        title:
          normalizedRole === "RETESTER"
            ? "My Retest Queue"
            : normalizedRole === "QA_REVIEWER"
              ? "My QA Review Queue"
              : "My Assigned Reviews",
        subtitle: "Only work mapped to your user is shown.",
        items: assigned.map(mapReviewItem),
      },
      {
        title: "Due Soon And Open Evidence",
        subtitle: "Upcoming dates and findings you own.",
        items: [
          ...dueSoonReviews.map(mapReviewItem),
          ...findings.map((finding) => ({
            label: finding.title,
            value: finding.status,
            meta: `${finding.project.sprId ?? finding.project.name} · ${
              finding.review?.srId ?? "No SR"
            }`,
            href: finding.reviewId ? reviewHref(finding.reviewId) : "/my-findings",
            tone: finding.severity === "Critical" ? "danger" as const : "default" as const,
          })),
        ],
      },
    ],
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
        { title: "Active Packages", value: activeProjects, variant: "open" },
        { title: "Active SRs", value: activeReviews, variant: "high" },
        { title: "Open Evidence", value: openFindings, variant: "critical" },
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
      title: "AI-powered Governance Dashboard",
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

  if (normalizedRole === "VALIDATOR") {
    const [
      prereqPending,
      readyForReview,
      missingAssignments,
      scopeProfiles,
      activeReviews,
    ] = await Promise.all([
      prisma.securityReview.count({
        where: {
          status: {
            in: ["Requested", "Prerequisites Pending", "Blocked"],
          },
        },
      }),
      prisma.securityReview.count({
        where: {
          status: "Ready for Review",
        },
      }),
      prisma.securityReview.count({
        where: {
          ...activeReviewWhere(),
          assignments: {
            none: {},
          },
        },
      }),
      prisma.scopeProfile.count(),
      prisma.securityReview.count({
        where: activeReviewWhere(),
      }),
    ]);

    return {
      title: "Validator Dashboard",
      description:
        "Pre-review readiness, demo-call intake, missing prerequisites, and handoff signals.",
      cards: [
        { title: "Prereq Pending", value: prereqPending, variant: "high" },
        { title: "Ready for Review", value: readyForReview, variant: "closed" },
        { title: "Needs Assignment", value: missingAssignments, variant: "critical" },
        { title: "Scope Profiles", value: scopeProfiles, variant: "default" },
        { title: "Active SRs", value: activeReviews, variant: "open" },
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
        { title: "Assigned Packages", value: managedProjects, variant: "default" },
        { title: "Active SRs", value: activeReviews, variant: "open" },
        { title: "Open Evidence", value: openFindings, variant: "critical" },
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
        { title: "Open Evidence", value: openFindings, variant: "critical" },
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

  if (normalizedRole === "RETESTER") {
    const [assignedRetests, dueSoonRetests, overdueRetests, completedRetests] =
      await Promise.all([
        prisma.securityReview.count({
          where: {
            ...activeReviewWhere(),
            assignments: {
              some: {
                userId: userId ?? undefined,
                role: {
                  contains: "Retester",
                  mode: "insensitive",
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
                role: {
                  contains: "Retester",
                  mode: "insensitive",
                },
              },
            },
          },
        }),
        prisma.securityReview.count({
          where: {
            ...activeReviewWhere(),
            dueDate: {
              lt: now,
            },
            assignments: {
              some: {
                userId: userId ?? undefined,
                role: {
                  contains: "Retester",
                  mode: "insensitive",
                },
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
                role: {
                  contains: "Retester",
                  mode: "insensitive",
                },
              },
            },
          },
        }),
      ]);

    return {
      title: "Retester Dashboard",
      description:
        "Retest assignments, due-soon validations, overdue retests, and completed retest work.",
      cards: [
        { title: "Assigned Retests", value: assignedRetests, variant: "open" },
        { title: "Due Soon", value: dueSoonRetests, variant: "high" },
        { title: "Overdue", value: overdueRetests, variant: "critical" },
        { title: "Completed", value: completedRetests, variant: "closed" },
        { title: "Focus", value: assignedRetests + overdueRetests, variant: "default" },
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
