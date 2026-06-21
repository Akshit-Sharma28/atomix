import { prisma } from "@/lib/prisma";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CalendarClock,
  Filter,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { canAccess } from "@/services/users/access.service";
import { getGovernanceDashboard } from "@/services/dashboard/governance.service";
import AgenticCapabilityPanel from "@/components/agents/agentic-capability-panel";

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

export default async function ReviewersPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    availability?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const query = params.q?.trim().toLowerCase() ?? "";
  const availabilityFilter = params.availability ?? "";

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

  const filteredReviewerRows = reviewerRows.filter((reviewer) => {
    const queryMatches =
      !query ||
      reviewer.name.toLowerCase().includes(query) ||
      reviewer.email.toLowerCase().includes(query) ||
      reviewer.skills.some((skill) =>
        skill.toLowerCase().includes(query),
      ) ||
      reviewer.assignments.some((assignment) =>
        [
          assignment.review.project.name,
          assignment.review.project.sprId,
          assignment.review.srId,
          assignment.review.title,
          assignment.workstream?.type,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query),
          ),
      );

    const availabilityMatches =
      !availabilityFilter ||
      reviewer.availability === availabilityFilter;

    return queryMatches && availabilityMatches;
  });

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-6 border-b border-slate-800 pb-5">
        <div className="mb-2 text-sm text-slate-500">Pentester Tracker</div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Reviewer Capacity & Assignments
            </h1>

            <p className="mt-2 max-w-3xl text-slate-400">
              See which pentesters are available, what SRs they are working on,
              where reviews need staffing, and where extension pressure is
              building.
            </p>
          </div>

          <a
            href="/reviewers/governance-call"
            className="rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 hover:bg-cyan-300"
          >
            Open Weekly Governance Call
          </a>
        </div>
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

      <form
        action="/reviewers"
        className="mb-4 rounded-2xl border border-slate-800 bg-slate-900 p-4"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_240px_auto]">
          <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
            <Search size={18} className="text-slate-500" />
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search reviewer, skill, SPR, SR, project..."
              className="w-full bg-transparent text-white outline-none"
            />
          </label>

          <select
            name="availability"
            defaultValue={availabilityFilter}
            className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white"
          >
            <option value="">All availability</option>
            <option>Available</option>
            <option>Profile Needed</option>
            <option>Busy</option>
            <option>On Leave</option>
            <option>Unavailable</option>
          </select>

          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950">
              <Filter size={16} />
              Filter
            </button>
            <a
              href="/reviewers"
              className="rounded-xl border border-slate-700 px-4 py-3 text-slate-300 hover:bg-slate-800"
            >
              Reset
            </a>
          </div>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Pentester Workload</h2>
          <p className="text-sm text-slate-400">
            Profiles use reviewer capacity when present, otherwise active users
            are shown as needing profile setup.
          </p>
        </div>

        <div className="divide-y divide-slate-800">
          {filteredReviewerRows.length === 0 && (
            <div className="p-10 text-center text-slate-500">
              No reviewers match the current filters.
            </div>
          )}

          {filteredReviewerRows.map((reviewer) => {
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
