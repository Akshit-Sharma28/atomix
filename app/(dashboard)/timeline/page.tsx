import Link from "next/link";
import KanbanBoard from "@/components/timeline/kanban-board";
import { prisma } from "@/lib/prisma";
import {
  CalendarClock,
  KanbanSquare,
  ShieldAlert,
} from "lucide-react";

function formatDate(date?: Date | null) {
  if (!date) return "No date";

  return date.toLocaleDateString();
}

export default async function TimelinePage() {
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

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <KanbanSquare
            size={40}
            className="text-cyan-400"
          />

          <div>
            <div className="mb-2 text-sm text-slate-500">
              Timeline
            </div>

            <h1 className="text-4xl font-bold text-white">
              Remediation & Review Board
            </h1>

            <p className="mt-2 text-slate-400">
              Track finding workflow and active SR delivery dates together.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Total Findings</span>
            <ShieldAlert size={20} className="text-cyan-300" />
          </div>
          <div className="mt-3 text-3xl font-bold text-cyan-300">
            {findings.length}
          </div>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Active SRs</span>
            <CalendarClock size={20} className="text-purple-300" />
          </div>
          <div className="mt-3 text-3xl font-bold text-purple-300">
            {activeReviews.length}
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-500/20 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Unassigned SRs</span>
            <CalendarClock size={20} className="text-yellow-300" />
          </div>
          <div className="mt-3 text-3xl font-bold text-yellow-300">
            {
              activeReviews.filter(
                (review) =>
                  review.assignments.length === 0
              ).length
            }
          </div>
        </div>
      </div>

      <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Active SR Timeline
            </h2>
            <p className="text-sm text-slate-400">
              Review due dates and staffing at a glance.
            </p>
          </div>

          <Link
            href="/reviews"
            className="rounded-xl border border-cyan-500/30 px-4 py-2 text-cyan-300 hover:bg-cyan-500/10"
          >
            Open Reviews
          </Link>
        </div>

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
                className="rounded-xl border border-slate-800 bg-slate-950 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">
                      {review.srId ?? review.title}
                    </p>
                    <p className="text-sm text-slate-500">
                      {review.project.sprId ??
                        review.project.name}
                      {" · "}
                      {review.status}
                    </p>
                  </div>

                  <span className="text-sm text-cyan-300">
                    {formatDate(review.dueDate)}
                  </span>
                </div>

                <div className="mt-3 text-sm text-slate-400">
                  {reviewers}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {review.workstreams.map(
                    (workstream) => (
                      <span
                        key={workstream.id}
                        className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300"
                      >
                        {workstream.type}
                      </span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <KanbanBoard findings={kanbanFindings} />
    </div>
  );
}
