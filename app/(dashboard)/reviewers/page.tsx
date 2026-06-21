import { prisma } from "@/lib/prisma";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CalendarClock,
  ClipboardCheck,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { canAccess } from "@/services/users/access.service";
import { getGovernanceDashboard } from "@/services/dashboard/governance.service";
import AgenticCapabilityPanel from "@/components/agents/agentic-capability-panel";
import { updateWeeklyGovernanceCall } from "./actions";

function formatDate(date?: Date | null) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function trendClass(trend: string) {
  if (
    trend.includes("action") ||
    trend.includes("watch") ||
    trend === "tight" ||
    trend === "down"
  ) {
    return "text-amber-300";
  }

  return "text-emerald-300";
}

function availabilityClass(availability: string) {
  if (availability === "Available") {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  }

  if (["Unavailable", "On Leave"].includes(availability)) {
    return "bg-red-500/15 text-red-300 border-red-500/30";
  }

  return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
}

export default async function ReviewersPage() {
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
            Pentester Tracker access restricted
          </h1>
          <p className="mt-2 text-slate-400">
            This governance view is available to Admin, Governance Team, and
            Executive roles only.
          </p>
        </div>
      </div>
    );
  }

  const [
    reviewers,
    users,
    unassignedReviews,
    governance,
    weeklyAssignments,
    canRunWeeklyCheckIn,
  ] = await Promise.all([
    prisma.reviewerProfile.findMany({
      include: {
        user: true,
        skills: true,
        assignments: {
          include: {
            review: {
              include: {
                project: true,
              },
            },
            workstream: true,
          },
          where: {
            status: {
              in: ["Assigned", "Accepted", "In Progress"],
            },
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    }),
    prisma.user.findMany({
      where: {
        isActive: true,
      },
      include: {
        reviewAssignments: {
          include: {
            review: {
              include: {
                project: true,
              },
            },
            workstream: true,
          },
          where: {
            status: {
              in: ["Assigned", "Accepted", "In Progress"],
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.securityReview.count({
      where: {
        assignments: {
          none: {},
        },
        status: {
          notIn: ["Completed", "Cancelled"],
        },
      },
    }),
    getGovernanceDashboard(),
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

  const reviewerRows =
    reviewers.length > 0
      ? reviewers.map((reviewer) => ({
          id: reviewer.id,
          name: reviewer.user.name,
          email: reviewer.user.email,
          availability: reviewer.availability,
          capacity: reviewer.weeklyCapacityHours,
          skills: reviewer.skills.map((skill) => skill.skill),
          assignments: reviewer.assignments,
        }))
      : users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          availability: "Profile Needed",
          capacity: 0,
          skills: [user.role],
          assignments: user.reviewAssignments,
        }));

  const totalCapacity = reviewerRows.reduce(
    (sum, reviewer) => sum + reviewer.capacity,
    0,
  );

  const allocatedHours = reviewerRows.reduce(
    (sum, reviewer) =>
      sum +
      reviewer.assignments.reduce(
        (assignmentSum, assignment) =>
          assignmentSum + (assignment.allocatedHours ?? 0),
        0,
      ),
    0,
  );

  const availableReviewers = reviewerRows.filter(
    (reviewer) => reviewer.availability === "Available",
  ).length;

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-6 pb-5 border-b border-slate-800">
        <div className="mb-2 text-sm text-slate-500">Pentester Tracker</div>

        <h1 className="text-3xl font-bold text-white">
          Reviewer Capacity & Assignments
        </h1>

        <p className="text-slate-400 mt-2 max-w-3xl">
          See which pentesters are available, what SRs they are working on,
          where reviews need staffing, and where extension pressure is building.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {governance.kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-cyan-500/10 bg-slate-900/70 p-4"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              {kpi.label}
            </p>
            <p className="mt-3 text-3xl font-black text-white">
              {kpi.value}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {kpi.helper}
            </p>
            <p
              className={`mt-2 text-xs font-semibold uppercase ${trendClass(
                kpi.trend,
              )}`}
            >
              {kpi.trend}
            </p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl border border-emerald-500/20 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Available</span>
            <UserCheck size={20} className="text-emerald-400" />
          </div>
          <div className="mt-3 text-4xl font-bold text-emerald-300">
            {availableReviewers}
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Capacity hrs/wk</span>
            <CalendarDays size={20} className="text-cyan-400" />
          </div>
          <div className="mt-3 text-4xl font-bold text-cyan-300">
            {totalCapacity}
          </div>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Allocated hrs</span>
            <Activity size={20} className="text-purple-400" />
          </div>
          <div className="mt-3 text-4xl font-bold text-purple-300">
            {allocatedHours}
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-500/20 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Unassigned SRs</span>
            <AlertTriangle size={20} className="text-yellow-400" />
          </div>
          <div className="mt-3 text-4xl font-bold text-yellow-300">
            {unassignedReviews}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <AgenticCapabilityPanel
          context="governance"
          metrics={[
            {
              label: "Available reviewers",
              value: availableReviewers,
            },
            {
              label: "Unassigned SRs",
              value: unassignedReviews,
            },
            {
              label: "Allocated hours",
              value: allocatedHours,
            },
          ]}
        />
      </div>

      <section className="mb-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <ClipboardCheck className="mt-1 text-cyan-300" size={24} />
            <div>
              <h2 className="text-2xl font-bold text-white">
                Weekly Governance Call
              </h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
                Use this during the weekly call with each reviewer. It lists
                assigned SRs that are not completed, then records whether the
                work is in progress, rescheduled, cancelled, completed, or needs
                a one/two-week extension.
              </p>
            </div>
          </div>
          <div className="rounded-full border border-cyan-400/20 bg-slate-950 px-4 py-2 text-sm font-semibold text-cyan-200">
            {weeklyAssignments.length} active assignments
          </div>
        </div>

        <div className="grid gap-4">
          {weeklyAssignments.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-center text-slate-400">
              No active reviewer assignments need a weekly check-in.
            </div>
          )}

          {weeklyAssignments.map((assignment) => {
            const reviewerName =
              assignment.user?.name ??
              assignment.reviewerProfile?.user.name ??
              "Unassigned reviewer";
            const pendingExtension = assignment.review.extensions[0];
            const latestActivity = assignment.review.activities[0];

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

                    <label className="lg:col-span-1">
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

                    <label className="lg:col-span-1">
                      <span className="mb-2 block text-xs font-semibold text-slate-400">
                        Extension
                      </span>
                      <select
                        name="extensionDays"
                        defaultValue="7"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
                      >
                        <option value="7">1 week</option>
                        <option value="14">2 weeks</option>
                        <option value="3">3 days</option>
                        <option value="5">5 days</option>
                        <option value="21">3 weeks</option>
                      </select>
                    </label>

                    <label className="lg:col-span-1">
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
                        placeholder="Blocked by access, app team requested 1 week, testing completed..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
                      />
                    </label>

                    <div className="flex items-end">
                      <button className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950">
                        Save Call Update
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

      <div className="mb-8 grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-cyan-500/10 bg-slate-900/60 p-4">
          <div className="mb-3 flex items-center gap-3">
            <UserCheck size={20} className="text-cyan-400" />
            <h2 className="text-lg font-bold">
              QA Pool & Availability
            </h2>
          </div>
          <div className="space-y-3">
            {governance.reviewerPool.slice(0, 6).map((reviewer) => (
              <div
                key={reviewer.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">
                      {reviewer.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {reviewer.role.replaceAll("_", " ")} ·{" "}
                      {reviewer.capacity}h capacity
                    </p>
                  </div>
                  <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-xs text-cyan-200">
                    {reviewer.availability}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  {reviewer.project}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {reviewer.sprId} · {reviewer.srId} · {reviewer.status}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-500/10 bg-slate-900/60 p-4">
          <div className="mb-3 flex items-center gap-3">
            <AlertTriangle size={20} className="text-amber-300" />
            <h2 className="text-lg font-bold">
              Red Projects
            </h2>
          </div>
          <div className="space-y-3">
            {governance.redProjects
              .slice(0, 5)
              .map((project) => (
                <div
                  key={project.id}
                  className="rounded-xl border border-red-500/20 bg-red-950/20 p-3"
                >
                  <p className="font-semibold text-white">
                    {project.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {project.status}
                  </p>
                  <p className="mt-2 text-xs text-red-200">
                    {project.sprId} · due {formatDate(project.dueDate)}
                    {project.openCriticals > 0
                      ? ` · ${project.openCriticals} open critical`
                      : ""}
                  </p>
                  <p className="mt-2 text-xs text-amber-200">
                    {project.reasons.join(", ")}
                  </p>
                </div>
              ))}
            {governance.redProjects.length === 0 && (
              <p className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-sm text-emerald-200">
                No red project signals in the active portfolio.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-500/10 bg-slate-900/60 p-4">
          <div className="mb-3 flex items-center gap-3">
            <CalendarClock size={20} className="text-cyan-400" />
            <h2 className="text-lg font-bold">
              Extensions & Reschedules
            </h2>
          </div>
          <div className="space-y-3">
            {governance.extensions.slice(0, 3).map((extension) => (
              <div
                key={extension.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
              >
                <p className="font-semibold text-white">
                  {extension.project}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {extension.srId} · until {formatDate(extension.requestedUntil)}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {extension.reason}
                </p>
              </div>
            ))}
            {governance.extensions.length === 0 && (
              <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-400">
                No pending extension requests.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-4 flex items-center gap-3">
            <CalendarClock className="text-cyan-400" size={22} />
            <h2 className="text-xl font-bold text-white">
              Active SR Delivery Board
            </h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-950/70 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="p-3">APIM / SPR / SR</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Due</th>
                </tr>
              </thead>
              <tbody>
                {governance.activeReviews.map((review) => (
                  <tr key={review.id} className="border-t border-slate-800">
                    <td className="p-3 text-slate-300">
                      <span className="block text-xs text-slate-500">
                        APIM grouped
                      </span>
                      {review.sprId} · {review.srId}
                    </td>
                    <td className="p-3 text-white">{review.project}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-xs text-cyan-200">
                        {review.status}
                      </span>
                    </td>
                    <td
                      className={`p-3 ${
                        review.isOverdue
                          ? "text-red-300"
                          : "text-slate-400"
                      }`}
                    >
                      {formatDate(review.dueDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-4 flex items-center gap-3">
            <Activity className="text-cyan-400" size={22} />
            <h2 className="text-xl font-bold text-white">
              Information System → SPR → SR Layer
            </h2>
          </div>
          <div className="grid gap-3">
            {governance.terminology.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <p className="font-bold text-cyan-200">
                  {item.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Pentester Workload</h2>
          <p className="text-sm text-slate-400">
            Profiles use reviewer capacity when present, otherwise active users
            are shown as needing profile setup.
          </p>
        </div>

        <div className="divide-y divide-slate-800">
          {reviewerRows.length === 0 && (
            <div className="p-10 text-center text-slate-500">
              No active users or reviewer profiles found.
            </div>
          )}

          {reviewerRows.map((reviewer) => {
            const assignedHours = reviewer.assignments.reduce(
              (sum, assignment) => sum + (assignment.allocatedHours ?? 0),
              0,
            );
            const remainingHours = reviewer.capacity - assignedHours;

            return (
              <div key={reviewer.id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">
                        {reviewer.name}
                      </h3>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${availabilityClass(
                          reviewer.availability,
                        )}`}
                      >
                        {reviewer.availability}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {reviewer.email}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {reviewer.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-slate-950 px-4 py-3">
                      <div className="text-xs text-slate-500">Capacity</div>
                      <div className="text-lg font-bold text-cyan-300">
                        {reviewer.capacity}
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-950 px-4 py-3">
                      <div className="text-xs text-slate-500">Allocated</div>
                      <div className="text-lg font-bold text-purple-300">
                        {assignedHours}
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-950 px-4 py-3">
                      <div className="text-xs text-slate-500">Remaining</div>
                      <div
                        className={
                          remainingHours < 0
                            ? "text-lg font-bold text-red-300"
                            : "text-lg font-bold text-emerald-300"
                        }
                      >
                        {remainingHours}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {reviewer.assignments.length === 0 && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-500">
                      No active SR assignments.
                    </div>
                  )}

                  {reviewer.assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-white">
                            {assignment.review.srId ?? assignment.review.title}
                          </div>
                          <div className="text-sm text-slate-500">
                            {assignment.review.project.name}
                            {assignment.workstream
                              ? ` • ${assignment.workstream.type}`
                              : ""}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-cyan-300">
                            {assignment.role}
                          </span>
                          <span className="text-slate-400">
                            {assignment.allocatedHours ?? 0}h
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck size={22} className="mt-0.5 text-emerald-300" />
          <p className="text-sm text-slate-400">
            This is the manager view for deciding who can take a frontend,
            backend, API, MSB, or LLM review next — and which SRs need
            assignment, extension, or cancellation attention.
          </p>
        </div>
      </div>
    </div>
  );
}
