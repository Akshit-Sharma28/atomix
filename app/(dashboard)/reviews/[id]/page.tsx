import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  FileSearch,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { canAccess } from "@/services/users/access.service";
import { updateReviewStatus } from "../actions";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

const statuses = [
  "Requested",
  "Prerequisites Pending",
  "Ready for Review",
  "Assigned",
  "In Progress",
  "Peer Review",
  "Retest Requested",
  "Retest In Progress",
  "Completed",
  "Cancelled",
  "Blocked",
];

function formatDate(date?: Date | null) {
  return date ? date.toLocaleDateString() : "Not set";
}

function statusClass(status: string) {
  if (status === "Completed") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (["Cancelled", "Blocked"].includes(status)) {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  if (["In Progress", "Assigned", "Peer Review"].includes(status)) {
    return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
  }

  return "border-slate-600 bg-slate-800 text-slate-300";
}

export default async function ReviewDetailPage({ params }: Props) {
  const { id } = await params;
  const canUpdate = await canAccess([
    "ADMIN",
    "GOVERNANCE_TEAM",
    "VALIDATOR",
    "QA_REVIEWER",
    "PROJECT_MANAGER",
    "ENGAGEMENT_MANAGER",
  ]);

  const review = await prisma.securityReview.findUnique({
    where: {
      id,
    },
    include: {
      project: {
        include: {
          projectManager: true,
        },
      },
      scopeProfile: {
        include: {
          scopeItems: true,
          requiredReviews: true,
        },
      },
      workstreams: true,
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
      findings: {
        orderBy: {
          createdAt: "desc",
        },
      },
      extensions: {
        orderBy: {
          createdAt: "desc",
        },
      },
      cancellation: true,
      activities: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!review) {
    notFound();
  }

  const reviewers = review.assignments.map((assignment) => ({
    name:
      assignment.user?.name ??
      assignment.reviewerProfile?.user.name ??
      "Unassigned",
    role: assignment.role,
    status: assignment.status,
    hours: assignment.allocatedHours,
  }));

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-6 border-b border-slate-800 pb-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Link
            href="/reviews"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
            Back to SR Tracker
          </Link>
          <Link
            href={`/projects/${review.projectId}`}
            className="rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-200 hover:border-cyan-300"
          >
            Open Information System
          </Link>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-cyan-300">
              Governance Review Record
            </p>
            <h1 className="mt-2 text-4xl font-bold text-white">
              {review.srId ?? review.title}
            </h1>
            <p className="mt-2 max-w-3xl text-slate-400">
              {review.title} under {review.project.sprId ?? review.project.name}
              {" "}for readiness, assignment, peer review, retest, and closure
              tracking.
            </p>
          </div>

          <span
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${statusClass(
              review.status,
            )}`}
          >
            {review.status}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Project", review.project.name],
          ["Review Type", review.type],
          ["Priority", review.priority],
          ["Due Date", formatDate(review.dueDate)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
          >
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-5 flex items-center gap-3">
            <FileSearch size={22} className="text-cyan-300" />
            <h2 className="text-2xl font-bold text-white">SR Details</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Detail label="Requested Start" value={formatDate(review.requestedStartDate)} />
            <Detail label="Actual Start" value={formatDate(review.actualStartDate)} />
            <Detail label="Completed" value={formatDate(review.completedAt)} />
            <Detail label="Cancelled" value={formatDate(review.cancelledAt)} />
            <Detail
              label="Project Manager"
              value={review.project.projectManager?.name ?? "Not assigned"}
            />
            <Detail
              label="Workstreams"
              value={
                review.workstreams.length
                  ? review.workstreams.map((item) => item.type).join(", ")
                  : "Not scoped"
              }
            />
          </div>

          {canUpdate && (
            <form
              action={updateReviewStatus}
              className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-5"
            >
              <input type="hidden" name="reviewId" value={review.id} />
              <h3 className="mb-4 font-bold text-white">Update SR Status</h3>
              <div className="grid gap-3 md:grid-cols-[240px_1fr_auto]">
                <select
                  name="status"
                  defaultValue={review.status}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <input
                  name="notes"
                  placeholder="Optional governance note"
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
                />
                <button className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950">
                  Save Status
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-5 flex items-center gap-3">
            <UserCheck size={22} className="text-cyan-300" />
            <h2 className="text-2xl font-bold text-white">Assignments</h2>
          </div>

          <div className="space-y-3">
            {reviewers.length === 0 && (
              <p className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-yellow-200">
                No reviewer assigned yet.
              </p>
            )}
            {reviewers.map((reviewer) => (
              <div
                key={`${reviewer.name}-${reviewer.role}`}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4"
              >
                <p className="font-semibold text-white">{reviewer.name}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {reviewer.role} · {reviewer.status}
                  {reviewer.hours ? ` · ${reviewer.hours}h` : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-5 flex items-center gap-3">
            <ShieldCheck size={22} className="text-cyan-300" />
            <h2 className="text-2xl font-bold text-white">Scope Readiness</h2>
          </div>

          {review.scopeProfile ? (
            <div className="space-y-4">
              <Detail label="Risk Profile" value={review.scopeProfile.riskProfile ?? "Not rated"} />
              <Detail
                label="Required Reviews"
                value={
                  review.scopeProfile.requiredReviews.length
                    ? review.scopeProfile.requiredReviews
                        .filter((item) => item.required)
                        .map((item) => item.type)
                        .join(", ")
                    : "Not captured"
                }
              />
              <Detail
                label="Scope Items"
                value={
                  review.scopeProfile.scopeItems.length
                    ? review.scopeProfile.scopeItems
                        .map((item) => `${item.type}: ${item.value ?? item.name}`)
                        .join(" · ")
                    : "No URL/IP entries captured"
                }
              />
            </div>
          ) : (
            <p className="text-slate-400">
              No scope profile attached. Use the Validator / Demo Call Agent to
              capture prerequisites before starting the review.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-5 flex items-center gap-3">
            <CalendarClock size={22} className="text-cyan-300" />
            <h2 className="text-2xl font-bold text-white">Exceptions</h2>
          </div>
          <div className="space-y-3">
            <Detail
              label="Extension Requests"
              value={
                review.extensions.length
                  ? review.extensions
                      .map(
                        (extension) =>
                          `${extension.status} until ${formatDate(
                            extension.requestedUntil,
                          )}`,
                      )
                      .join(" · ")
                  : "None"
              }
            />
            <Detail
              label="Cancellation"
              value={
                review.cancellation
                  ? `${review.cancellation.status}: ${review.cancellation.reason}`
                  : "None"
              }
            />
            <Detail label="Evidence Items" value={`${review.findings.length}`} />
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-5 flex items-center gap-3">
          <Activity size={22} className="text-cyan-300" />
          <h2 className="text-2xl font-bold text-white">Activity Log</h2>
        </div>
        <div className="space-y-3">
          {review.activities.length === 0 && (
            <p className="text-slate-400">No SR activity recorded yet.</p>
          )}
          {review.activities.map((activity) => (
            <div
              key={activity.id}
              className="rounded-xl border border-slate-800 bg-slate-950 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-white">{activity.action}</p>
                <p className="text-xs text-slate-500">
                  {activity.createdAt.toLocaleString()}
                </p>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                {activity.oldValue ? `${activity.oldValue} → ` : ""}
                {activity.newValue ?? ""}
                {activity.notes ? ` · ${activity.notes}` : ""}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">
        {value}
      </p>
    </div>
  );
}
