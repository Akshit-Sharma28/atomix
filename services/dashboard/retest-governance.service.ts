import { prisma } from "@/lib/prisma";

const retestStatuses = [
  "Not Assigned",
  "In Progress",
  "Cancelled",
  "Completed",
  "Overdue",
  "Extension Needed",
];

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function statusForIndex(index: number, dueDate: Date) {
  if (dueDate.getTime() < Date.now()) {
    return "Overdue";
  }

  return retestStatuses[index % retestStatuses.length];
}

function formatReviewer(profile?: {
  user: {
    name: string;
  };
} | null) {
  return profile?.user.name ?? "Unassigned";
}

export async function getRetestGovernanceDashboard() {
  const [projects, reviewerProfiles] = await Promise.all([
    prisma.project.findMany({
      include: {
        findings: {
          where: {
            status: {
              not: "Closed",
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
        reviews: {
          include: {
            assignments: {
              include: {
                reviewerProfile: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
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

  const requests = projects.map((project, index) => {
    const review = project.reviews[0];
    const initialAssignment = review?.assignments[0];
    const assignedReviewer =
      availableReviewers[index % Math.max(availableReviewers.length, 1)] ??
      reviewerProfiles[index % Math.max(reviewerProfiles.length, 1)];
    const dueDate = daysFromNow(index % 4 === 0 ? -2 : 3 + index);
    const status = statusForIndex(index, dueDate);
    const controlsCount = Math.max(
      1,
      Math.min(12, project.findings.length + 2 + (index % 5)),
    );
    const type =
      index % 5 === 0
        ? "Web + LLM"
        : index % 4 === 0
          ? "Thick Client"
          : index % 3 === 0
            ? "LLM"
            : index % 2 === 0
              ? "API"
              : "Web";
    const priorIterations = index % 3;

    return {
      id: project.id,
      projectId: project.id,
      project: project.name,
      client: project.client ?? "Internal",
      sprId: project.sprId ?? "SPR pending",
      srId: review?.srId ?? review?.title ?? "SR pending",
      chargeCode: `CC-${String(index + 4240).padStart(5, "0")}`,
      type,
      scope:
        type === "Web + LLM"
          ? "Retest web controls, LLM FEAD controls, and auth/session fixes."
          : type === "API"
            ? "Retest API auth, JWT, rate limiting, and input validation fixes."
            : type === "Thick Client"
              ? "Retest signed binary, local storage, and anti-tamper fixes."
              : "Retest remediated web findings and evidence.",
      requestedAt: daysFromNow(-index - 1),
      dueDate,
      controlsCount,
      controlsSummary: project.findings
        .slice(0, 3)
        .map((finding) => finding.title)
        .join(", ") || "Controls pending evidence mapping",
      accessReady: index % 3 !== 0,
      fixesReady: index % 2 === 0,
      status,
      extensionNeeded: status === "Extension Needed" || status === "Overdue",
      assignedReviewer: formatReviewer(assignedReviewer),
      initialReviewer: formatReviewer(
        initialAssignment?.reviewerProfile,
      ),
      priorIterations,
      priorRetesters:
        priorIterations > 0
          ? Array.from({
              length: priorIterations,
            }).map((_, iterationIndex) =>
              formatReviewer(
                reviewerProfiles[
                  (index + iterationIndex + 1) %
                    Math.max(reviewerProfiles.length, 1)
                ],
              ),
            )
          : [],
      recommendation:
        index % 3 === 0
          ? "Wait for project team to confirm fixes and access before assigning."
          : `Assign to ${formatReviewer(assignedReviewer)} based on current availability.`,
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
