import Link from "next/link";
import KanbanBoard from "@/components/timeline/kanban-board";
import { prisma } from "@/lib/prisma";
import {
  Activity,
  CalendarClock,
  Clock3,
  KanbanSquare,
  ShieldAlert,
  UserRoundCheck,
} from "lucide-react";

function formatDate(date?: Date | null) {
  if (!date) return "No date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export default async function TimelinePage() {
  const currentTime = new Date().getTime();
  const [findings, reviews] =
    await Promise.all([
      prisma.finding.findMany({
        include: {
          owner: true,
          project: true,
          review: true,
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
        },
        orderBy: {
          dueDate: "asc",
        },
      }),
    ]);

  const kanbanFindings =
    findings.map((finding) => ({
      id: finding.id,
      title: finding.title,
      severity: finding.severity,
      status: finding.status,
      owner:
        finding.owner?.name ?? null,
      project:
        finding.project.sprId ??
        finding.project.name,
      review:
        finding.review?.srId ??
        finding.review?.title ??
        null,
      dueDate: finding.dueDate
        ? finding.dueDate.toLocaleDateString()
        : null,
    }));

  const activeReviews =
    reviews.filter(
      (review) =>
        !["Completed", "Cancelled"].includes(
          review.status
        )
    );
  const unassignedReviews = activeReviews.filter(
    (review) => review.assignments.length === 0,
  );
  const overdueReviews = activeReviews.filter(
    (review) =>
      review.dueDate && review.dueDate.getTime() < currentTime,
  );
  const dueSoonReviews = activeReviews.filter((review) => {
    if (!review.dueDate) {
      return false;
    }

    const daysUntilDue =
      (review.dueDate.getTime() - currentTime) /
      (1000 * 60 * 60 * 24);

    return daysUntilDue >= 0 && daysUntilDue <= 7;
  });

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-6 rounded-3xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/[0.08] via-slate-900/70 to-slate-950 p-6 shadow-2xl shadow-cyan-950/20">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
              <KanbanSquare size={28} />
            </div>

            <div>
              <div className="mb-2 text-xs uppercase tracking-[0.22em] text-cyan-300">
                Timeline Command Center
              </div>

              <h1 className="text-3xl font-black text-white">
                Review Delivery & Remediation Flow
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                One operating view for SR due dates, reviewer assignment
                pressure, remediation states, and next governance actions.
              </p>
            </div>
          </div>

          <Link
            href="/reviews"
            className="rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/10"
          >
            Open Reviews
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Findings", findings.length, "remediation items", ShieldAlert, "text-cyan-300"],
          ["Active SRs", activeReviews.length, "in delivery", CalendarClock, "text-purple-300"],
          ["Unassigned", unassignedReviews.length, "need reviewer", UserRoundCheck, "text-yellow-300"],
          ["Overdue", overdueReviews.length, "past due", Clock3, "text-red-300"],
          ["Due 7 days", dueSoonReviews.length, "watchlist", Activity, "text-emerald-300"],
        ].map(([label, value, helper, Icon, color]) => {
          const MetricIcon = Icon as typeof ShieldAlert;

          return (
            <div
              key={label as string}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  {label as string}
                </p>
                <MetricIcon size={18} className={color as string} />
              </div>
              <p className={`mt-3 text-3xl font-black ${color as string}`}>
                {value as number}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {helper as string}
              </p>
            </div>
          );
        })}
      </div>

      <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">
              Active SR Delivery Timeline
            </h2>
            <p className="text-sm text-slate-400">
              Compact queue for due dates, staffing, and workstream coverage.
            </p>
          </div>

          <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-xs font-semibold text-purple-100">
            {activeReviews.length} active · {unassignedReviews.length} unassigned
          </span>
        </div>

        <div className="max-h-[430px] overflow-y-auto pr-1">
          <div className="grid gap-3 lg:grid-cols-2">
          {activeReviews.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-500">
              No active reviews.
            </div>
          )}

          {activeReviews.slice(0, 6).map((review) => {
            const reviewers =
              review.assignments
                .map(
                  (assignment) =>
                    assignment.user?.name ??
                    assignment.reviewerProfile
                      ?.user.name ??
                    "Unassigned"
                )
                .join(", ") ||
              "Needs assignment";

            return (
              <div
                key={review.id}
                className="rounded-xl border border-slate-800 bg-slate-950/80 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold leading-tight text-white">
                      {review.srId ?? review.title}
                    </p>
                    <p className="text-sm text-slate-500">
                      {review.project.sprId ??
                        review.project.name}
                      {" · "}
                      {review.status}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-semibold text-cyan-300">
                    {formatDate(review.dueDate)}
                  </span>
                </div>

                <div className="mt-3 text-sm text-slate-400">
                  {reviewers}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {review.workstreams.slice(0, 4).map(
                    (workstream) => (
                      <span
                        key={workstream.id}
                        className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300"
                      >
                        {workstream.type}
                      </span>
                    )
                  )}
                  {review.workstreams.length > 4 && (
                    <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
                      +{review.workstreams.length - 4}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </section>

      <KanbanBoard findings={kanbanFindings} />
    </div>
  );
}
