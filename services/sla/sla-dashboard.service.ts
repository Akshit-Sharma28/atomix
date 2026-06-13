import { prisma } from "../../lib/prisma";

const CLOSED_FINDING_STATUSES =
  new Set([
    "Closed",
    "Resolved",
    "Risk Accepted",
    "False Positive",
  ]);

const CLOSED_REVIEW_STATUSES =
  new Set([
    "Completed",
    "Cancelled",
  ]);

function daysUntil(date: Date) {
  const now = new Date();

  return Math.ceil(
    (date.getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

export async function getSLAMetrics() {
  const [
    findings,
    reviews,
    remediationPlans,
    riskExceptions,
  ] = await Promise.all([
    prisma.finding.findMany({
      include: {
        project: true,
        review: true,
        component: true,
        owner: true,
        remediationPlan: true,
        riskExceptions: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    }),
    prisma.securityReview.findMany({
      include: {
        project: true,
        assignments: {
          include: {
            user: true,
            reviewerProfile: {
              include: {
                user: true,
              },
            },
          },
        },
        workstreams: true,
        extensions: true,
        cancellation: true,
        findings: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    }),
    prisma.remediationPlan.findMany({
      include: {
        finding: {
          include: {
            project: true,
          },
        },
        owner: true,
      },
      orderBy: {
        targetDate: "asc",
      },
    }),
    prisma.riskException.findMany({
      include: {
        finding: {
          include: {
            project: true,
          },
        },
      },
      orderBy: {
        expiresAt: "asc",
      },
    }),
  ]);

  const now = new Date();

  const overdue = findings.filter(
    (f) =>
      f.dueDate &&
      new Date(f.dueDate) < now &&
      !CLOSED_FINDING_STATUSES.has(f.status)
  );

  const dueSoon = findings.filter((f) => {
    if (!f.dueDate) return false;
    if (CLOSED_FINDING_STATUSES.has(f.status)) return false;

    const diff =
      daysUntil(new Date(f.dueDate));

    return diff >= 0 && diff <= 7;
  });

  const activeFindings =
    findings.filter(
      (finding) =>
        !CLOSED_FINDING_STATUSES.has(
          finding.status
        )
    );

  const compliant =
    activeFindings.length -
    overdue.length;

  const compliancePercent =
    activeFindings.length === 0
      ? 100
      : Math.round(
          (compliant /
            activeFindings.length) *
            100
        );

  const activeReviews =
    reviews.filter(
      (review) =>
        !CLOSED_REVIEW_STATUSES.has(
          review.status
        )
    );

  const overdueReviews =
    activeReviews.filter(
      (review) =>
        review.dueDate &&
        new Date(review.dueDate) < now
    );

  const reviewsDueSoon =
    activeReviews.filter((review) => {
      if (!review.dueDate) return false;

      const diff =
        daysUntil(new Date(review.dueDate));

      return diff >= 0 && diff <= 7;
    });

  const unassignedReviews =
    activeReviews.filter(
      (review) =>
        review.assignments.length === 0
    );

  const extensionRequests =
    reviews.flatMap((review) =>
      review.extensions
        .filter(
          (extension) =>
            extension.status === "Requested"
        )
        .map((extension) => ({
          id: extension.id,
          srId:
            review.srId ??
            review.title,
          projectName:
            review.project.name,
          requestedUntil:
            extension.requestedUntil,
          reason:
            extension.reason,
          daysUntil:
            daysUntil(
              extension.requestedUntil
            ),
        }))
    );

  const cancellationRequests =
    reviews.filter(
      (review) =>
        review.cancellation &&
        review.cancellation.status ===
          "Requested"
    );

  const exceptionExpiringSoon =
    riskExceptions.filter((exception) => {
      if (!exception.expiresAt) return false;

      const diff =
        daysUntil(exception.expiresAt);

      return diff >= 0 && diff <= 30;
    });

  const remediationDueSoon =
    remediationPlans.filter((plan) => {
      if (!plan.targetDate) return false;

      const diff =
        daysUntil(plan.targetDate);

      return (
        diff >= 0 &&
        diff <= 14 &&
        plan.status !== "Completed"
      );
    });

  return {
    total: findings.length,
    activeFindings:
      activeFindings.length,
    overdue: overdue.length,
    dueSoon: dueSoon.length,
    compliancePercent,
    reviewTotal: reviews.length,
    activeReviews:
      activeReviews.length,
    overdueReviews:
      overdueReviews.length,
    reviewsDueSoon:
      reviewsDueSoon.length,
    unassignedReviews:
      unassignedReviews.length,
    extensionRequests:
      extensionRequests.length,
    cancellationRequests:
      cancellationRequests.length,
    exceptionExpiringSoon:
      exceptionExpiringSoon.length,
    remediationDueSoon:
      remediationDueSoon.length,
    overdueFindings:
      overdue.slice(0, 8).map((finding) => ({
        id: finding.id,
        title: finding.title,
        severity: finding.severity,
        status: finding.status,
        dueDate: finding.dueDate,
        daysOverdue: finding.dueDate
          ? Math.abs(
              daysUntil(
                new Date(finding.dueDate)
              )
            )
          : 0,
        projectName:
          finding.project.name,
        sprId:
          finding.project.sprId,
        srId:
          finding.review?.srId ??
          finding.review?.title,
        componentName:
          finding.component?.name,
        ownerName:
          finding.owner?.name,
      })),
    reviewSlaItems:
      activeReviews.slice(0, 8).map((review) => ({
        id: review.id,
        title: review.title,
        srId:
          review.srId ??
          review.title,
        projectName:
          review.project.name,
        sprId:
          review.project.sprId,
        status:
          review.status,
        priority:
          review.priority,
        dueDate:
          review.dueDate,
        daysUntilDue:
          review.dueDate
            ? daysUntil(
                new Date(review.dueDate)
              )
            : null,
        reviewers:
          review.assignments.map(
            (assignment) =>
              assignment.user?.name ??
              assignment.reviewerProfile
                ?.user.name ??
              "Unassigned"
          ),
        workstreams:
          review.workstreams.map(
            (workstream) =>
              workstream.type
          ),
        findingCount:
          review.findings.length,
        needsExtension:
          review.extensions.some(
            (extension) =>
              extension.status ===
              "Requested"
          ),
        cancellationRequested:
          Boolean(
            review.cancellation &&
              review.cancellation.status ===
                "Requested"
          ),
      })),
  };
}
