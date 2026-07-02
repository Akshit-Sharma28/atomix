import { prisma } from "@/lib/prisma";

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function displayStatus(review: {
  status: string;
  dueDate: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  assignments: unknown[];
}) {
  if (review.completedAt || review.status === "Completed") {
    return "Completed";
  }

  if (review.cancelledAt || review.status === "Cancelled") {
    return "Cancelled";
  }

  if (review.status === "Extension Needed") {
    return "Extension Needed";
  }

  if (review.dueDate && review.dueDate.getTime() < Date.now()) {
    return "Overdue";
  }

  if (review.assignments.length === 0 || review.status === "Requested") {
    return "Not Assigned";
  }

  return "In Progress";
}

function formatReviewer(profile?: {
  user: {
    name: string;
  };
} | null) {
  return profile?.user.name ?? "Unassigned";
}

function activityValue(notes: string | null | undefined, label: string) {
  if (!notes) {
    return "";
  }

  const match = notes.match(new RegExp(`${label}: ([^|]+)`, "i"));
  return match?.[1]?.trim() ?? "";
}

function reviewTypeLabel(review: {
  title: string;
  type: string;
  workstreams: {
    type: string;
  }[];
  findings: {
    source: string;
  }[];
  activities: {
    notes: string | null;
  }[];
}) {
  const text = [
    review.title,
    review.type,
    ...review.workstreams.map((workstream) => workstream.type),
    ...review.findings.map((finding) => finding.source),
    ...review.activities.map((activity) => activity.notes ?? ""),
  ]
    .join(" ")
    .toLowerCase();

  if (text.includes("llm") && text.includes("web")) {
    return "Web + LLM";
  }

  if (text.includes("llm")) {
    return "LLM";
  }

  if (text.includes("api")) {
    return "API";
  }

  if (text.includes("thick") || text.includes("client")) {
    return "Thick Client";
  }

  return "Web";
}

export async function getRetestGovernanceDashboard() {
  const [reviews, reviewerProfiles] = await Promise.all([
    prisma.securityReview.findMany({
      where: {
        OR: [
          {
            type: "RETEST",
          },
          {
            activities: {
              some: {
                action: {
                  in: ["Retest requested", "Infosec review requested"],
                },
              },
            },
          },
        ],
      },
      include: {
        project: true,
        assignments: {
          include: {
            reviewerProfile: {
              include: {
                user: true,
              },
            },
            user: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
        findings: {
          orderBy: {
            updatedAt: "desc",
          },
        },
        workstreams: true,
        activities: {
          orderBy: {
            createdAt: "desc",
          },
        },
        extensions: {
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 50,
    }),
    prisma.reviewerProfile.findMany({
      include: {
        user: true,
        skills: true,
        assignments: {
          where: {
            status: {
              in: ["Assigned", "Accepted", "In Progress"],
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);

  const availableReviewers = reviewerProfiles.filter((profile) =>
    profile.availability.toLowerCase().includes("available"),
  );

  const requests = reviews.map((review, index) => {
    const latestRequestActivity = review.activities.find((activity) =>
      ["Retest requested", "Infosec review requested"].includes(activity.action),
    );
    const latestAssignment = review.assignments[0];
    const initialAssignment = review.assignments.at(-1);
    const assignedReviewer =
      latestAssignment?.reviewerProfile ??
      availableReviewers[index % Math.max(availableReviewers.length, 1)] ??
      reviewerProfiles[index % Math.max(reviewerProfiles.length, 1)];
    const dueDate = review.dueDate ?? daysFromNow(5 + index);
    const status = displayStatus(review);
    const notes = latestRequestActivity?.notes;
    const parsedControlsCount = Number(
      activityValue(notes, "Controls in scope"),
    );
    const controlsCount = Math.max(
      1,
      Number.isFinite(parsedControlsCount) && parsedControlsCount > 0
        ? parsedControlsCount
        : Math.min(12, review.findings.length + review.workstreams.length + 1),
    );
    const type = reviewTypeLabel(review);
    const priorIterations = Math.max(0, review.assignments.length - 1);

    return {
      id: review.id,
      projectId: review.projectId,
      project: review.project.name,
      client: review.project.client ?? "Internal",
      sprId: review.project.sprId ?? "SPR pending",
      srId: review.srId ?? review.title,
      chargeCode:
        activityValue(notes, "Charge") ||
        `CC-${String(index + 4240).padStart(5, "0")}`,
      type,
      scope:
        activityValue(notes, "Scope") ||
        review.workstreams.map((workstream) => workstream.type).join(", ") ||
        review.title,
      requestedAt: review.createdAt,
      dueDate,
      controlsCount,
      controlsSummary: review.findings
        .slice(0, 3)
        .map((finding) => finding.title)
        .join(", ") || "Controls pending evidence mapping",
      accessReady: status !== "Not Assigned" || index % 3 !== 0,
      fixesReady: status !== "Not Assigned" || index % 2 === 0,
      status,
      extensionNeeded:
        review.extensions.some((extension) => extension.status === "Requested") ||
        status === "Extension Needed" ||
        status === "Overdue",
      assignedReviewer: formatReviewer(assignedReviewer),
      initialReviewer: formatReviewer(
        initialAssignment?.reviewerProfile,
      ),
      priorIterations,
      priorRetesters:
        priorIterations > 0
          ? review.assignments
              .slice(1)
              .map((assignment) => formatReviewer(assignment.reviewerProfile))
          : [],
      recommendation:
        status === "Not Assigned" && index % 3 === 0
          ? "Wait for project team to confirm fixes and access before assigning."
          : status === "Not Assigned"
            ? `Assign to ${formatReviewer(assignedReviewer)} based on current availability.`
            : `Continue retest with ${formatReviewer(assignedReviewer)} and monitor due date.`,
    };
  });

  const notAssigned = requests.filter(
    (request) => request.status === "Not Assigned",
  ).length;
  const inProgress = requests.filter(
    (request) => request.status === "In Progress",
  ).length;
  const overdue = requests.filter(
    (request) => request.status === "Overdue",
  ).length;
  const extensionNeeded = requests.filter(
    (request) => request.extensionNeeded,
  ).length;
  const completed = requests.filter(
    (request) => request.status === "Completed",
  ).length;
  const controlsInRetest = requests.reduce(
    (total, request) => total + request.controlsCount,
    0,
  );

  return {
    summary: {
      total: requests.length,
      controlsInRetest,
      notAssigned,
      inProgress,
      overdue,
      extensionNeeded,
      completed,
      availableReviewers: availableReviewers.length,
    },
    requests,
    reviewerQueue: availableReviewers.map((profile) => ({
      id: profile.id,
      name: profile.user.name,
      availability: profile.availability,
      capacity: profile.weeklyCapacityHours,
      activeAssignments: profile.assignments.length,
      skills: profile.skills.map((skill) => skill.skill).slice(0, 4),
    })),
    insights: [
      notAssigned > 0
        ? `${notAssigned} retest requests are waiting for reviewer assignment.`
        : "No unassigned retest requests in the current queue.",
      overdue > 0
        ? `${overdue} retest requests are overdue and should be escalated.`
        : "No overdue retest requests in the current queue.",
      extensionNeeded > 0
        ? `${extensionNeeded} retest requests need extension decisions or revised access dates.`
        : "No extension pressure detected for retests.",
    ],
  };
}
