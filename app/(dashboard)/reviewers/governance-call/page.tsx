import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/services/users/access.service";
import { updateWeeklyGovernanceCall } from "../actions";
import {
  ClipboardCheck,
  Filter,
  Search,
  UserCheck,
} from "lucide-react";

function formatDate(date?: Date | null) {
  if (!date) return "Not set";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function includes(value: string | null | undefined, query: string) {
  return (value ?? "").toLowerCase().includes(query.toLowerCase());
}

export default async function GovernanceCallPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    reviewer?: string;
    project?: string;
  }>;
}) {
  const allowed = await canAccess([
    "ADMIN",
    "GOVERNANCE_TEAM",
    "EXECUTIVE",
  ]);

  if (!allowed) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
          <h1 className="text-2xl font-bold text-white">
            Governance call access restricted
          </h1>
          <p className="mt-2 text-slate-400">
            This page is available to Admin, Governance Team, and Executive
            roles only.
          </p>
        </div>
      </div>
    );
  }

  const params = (await searchParams) ?? {};
  const query = params.q?.trim() ?? "";
  const status = params.status ?? "";
  const reviewer = params.reviewer ?? "";
  const project = params.project ?? "";

  const [weeklyAssignments, canRunWeeklyCheckIn] = await Promise.all([
    prisma.reviewerAssignment.findMany({
      where: {
        status: {
          in: ["Assigned", "Accepted", "In Progress"],
        },
        review: {
          status: {
            notIn: ["Completed", "Cancelled"],
          },
        },
      },
      include: {
        user: true,
        reviewerProfile: {
          include: {
            user: true,
          },
        },
        review: {
          include: {
            project: true,
            extensions: {
              where: {
                status: "Requested",
              },
              orderBy: {
                createdAt: "desc",
              },
            },
            cancellation: true,
            activities: {
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
          },
        },
        workstream: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    canAccess(["ADMIN", "GOVERNANCE_TEAM"]),
  ]);

  const reviewerOptions = Array.from(
    new Set(
      weeklyAssignments.map(
        (assignment) =>
          assignment.user?.name ??
          assignment.reviewerProfile?.user.name ??
          "Unassigned reviewer"
      )
    )
  ).sort();

  const projectOptions = Array.from(
    new Set(
      weeklyAssignments.map(
        (assignment) =>
          assignment.review.project.sprId ??
          assignment.review.project.name
      )
    )
  ).sort();

  const filteredAssignments = weeklyAssignments.filter((assignment) => {
    const reviewerName =
      assignment.user?.name ??
      assignment.reviewerProfile?.user.name ??
      "Unassigned reviewer";
    const projectLabel =
      assignment.review.project.sprId ??
      assignment.review.project.name;
    const srLabel =
      assignment.review.srId ??
      assignment.review.title;

    const queryMatch =
      !query ||
      includes(reviewerName, query) ||
      includes(projectLabel, query) ||
      includes(assignment.review.project.name, query) ||
      includes(srLabel, query) ||
      includes(assignment.workstream?.type, query);

    const statusMatch =
      !status || assignment.review.status === status;
    const reviewerMatch =
      !reviewer || reviewerName === reviewer;
    const projectMatch =
      !project || projectLabel === project;

    return queryMatch && statusMatch && reviewerMatch && projectMatch;
  });

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-6 border-b border-slate-800 pb-5">
        <div className="mb-2 text-sm text-slate-500">
          Pentester Tracker / Weekly Call
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <ClipboardCheck className="mt-1 text-cyan-300" size={34} />
            <div>
              <h1 className="text-3xl font-bold text-white">
                Weekly Governance Call
              </h1>
              <p className="mt-2 max-w-4xl text-slate-400">
                Review every non-completed assignment, capture status from the
                weekly reviewer call, record reschedules/cancellations, or add
                an extension only when the reviewer asks for one.
              </p>
            </div>
          </div>

          <Link
            href="/reviewers"
            className="rounded-xl border border-cyan-400/30 px-4 py-2.5 font-semibold text-cyan-200 hover:border-cyan-300"
          >
            Back to Pentester Tracker
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Metric label="Active Check-ins" value={filteredAssignments.length} />
        <Metric
          label="Extension Requests"
          value={
            filteredAssignments.filter(
              (item) => item.review.extensions.length > 0
            ).length
          }
        />
        <Metric
          label="Reviewers"
          value={
            new Set(
              filteredAssignments.map(
                (item) =>
                  item.user?.name ??
                  item.reviewerProfile?.user.name ??
                  "Unassigned reviewer"
              )
            ).size
          }
        />
      </div>

      <form
        action="/reviewers/governance-call"
        className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4"
      >
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
            <Search size={18} className="text-slate-500" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search reviewer, SPR, SR, project, workstream..."
              className="w-full bg-transparent text-white outline-none"
            />
          </label>

          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white"
          >
            <option value="">All statuses</option>
            <option>Requested</option>
            <option>Assigned</option>
            <option>Accepted</option>
            <option>In Progress</option>
          </select>

          <select
            name="reviewer"
            defaultValue={reviewer}
            className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white"
          >
            <option value="">All reviewers</option>
            {reviewerOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <select
            name="project"
            defaultValue={project}
            className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white"
          >
            <option value="">All projects</option>
            {projectOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950">
              <Filter size={16} />
              Filter
            </button>
            <Link
              href="/reviewers/governance-call"
              className="rounded-xl border border-slate-700 px-4 py-3 text-slate-300 hover:bg-slate-800"
            >
              Reset
            </Link>
          </div>
        </div>
      </form>

      <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Call Worklist
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
              Extension duration is optional and only used when status is
              Extension Needed. For In Progress or Completed, leave it as No
              extension.
            </p>
          </div>
          <div className="rounded-full border border-cyan-400/20 bg-slate-950 px-4 py-2 text-sm font-semibold text-cyan-200">
            {filteredAssignments.length} visible assignments
          </div>
        </div>

        <div className="grid gap-4">
          {filteredAssignments.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-center text-slate-400">
              No active reviewer assignments match the filters.
            </div>
          )}

          {filteredAssignments.map((assignment) => {
            const reviewerName =
              assignment.user?.name ??
              assignment.reviewerProfile?.user.name ??
              "Unassigned reviewer";
            const pendingExtension =
              assignment.review.extensions[0];
            const latestActivity =
              assignment.review.activities[0];

            return (
              <div
                key={assignment.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
              >
                <div className="mb-4 grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Reviewer
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-white">
                      {reviewerName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {assignment.role} · {assignment.allocatedHours ?? 0}h
                      allocated
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Project / SR
                    </p>
                    <p className="mt-2 font-semibold text-white">
                      {assignment.review.project.sprId ??
                        assignment.review.project.name}{" "}
                      · {assignment.review.srId ?? assignment.review.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {assignment.review.project.name}
                      {assignment.workstream
                        ? ` · ${assignment.workstream.type}`
                        : ""}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      Current state
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                        {assignment.review.status}
                      </span>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                        due {formatDate(assignment.review.dueDate)}
                      </span>
                      {pendingExtension && (
                        <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
                          extension requested to{" "}
                          {formatDate(pendingExtension.requestedUntil)}
                        </span>
                      )}
                    </div>
                    {latestActivity && (
                      <p className="mt-2 text-xs text-slate-500">
                        Last update: {latestActivity.action}
                      </p>
                    )}
                  </div>
                </div>

                {canRunWeeklyCheckIn ? (
                  <form
                    action={updateWeeklyGovernanceCall}
                    className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 lg:grid-cols-6"
                  >
                    <input
                      type="hidden"
                      name="reviewId"
                      value={assignment.reviewId}
                    />
                    <input
                      type="hidden"
                      name="assignmentId"
                      value={assignment.id}
                    />

                    <label>
                      <span className="mb-2 block text-xs font-semibold text-slate-400">
                        Status from call
                      </span>
                      <select
                        name="callStatus"
                        defaultValue="In Progress"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
                      >
                        <option>In Progress</option>
                        <option>Completed</option>
                        <option>Rescheduled</option>
                        <option>Extension Needed</option>
                        <option>Cancelled</option>
                      </select>
                    </label>

                    <label>
                      <span className="mb-2 block text-xs font-semibold text-slate-400">
                        Extension
                      </span>
                      <select
                        name="extensionDays"
                        defaultValue=""
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
                      >
                        <option value="">No extension</option>
                        <option value="7">1 week</option>
                        <option value="14">2 weeks</option>
                        <option value="3">3 days</option>
                        <option value="5">5 days</option>
                        <option value="21">3 weeks</option>
                      </select>
                    </label>

                    <label>
                      <span className="mb-2 block text-xs font-semibold text-slate-400">
                        New due date
                      </span>
                      <input
                        name="newDueDate"
                        type="date"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
                      />
                    </label>

                    <label className="lg:col-span-2">
                      <span className="mb-2 block text-xs font-semibold text-slate-400">
                        Call notes
                      </span>
                      <input
                        name="notes"
                        placeholder="Blocked by access, testing completed, rescheduled to next week..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
                      />
                    </label>

                    <div className="flex items-end">
                      <button className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950">
                        Save Update
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">
                    Executive view is read-only. Governance Team or Admin can
                    record weekly call updates.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5">
      <div className="flex items-center justify-between text-slate-400">
        <span>{label}</span>
        <UserCheck size={20} className="text-cyan-300" />
      </div>
      <div className="mt-3 text-4xl font-bold text-cyan-300">
        {value}
      </div>
    </div>
  );
}
