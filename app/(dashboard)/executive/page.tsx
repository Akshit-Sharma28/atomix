import Link from "next/link";
import {
  BarChart3,
  Eye,
  Filter,
  Search,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

import { canAccess } from "@/services/users/access.service";
import {
  ExecutiveFilter,
  ExecutiveSort,
  getExecutiveDashboard,
} from "@/services/dashboard/executive.service";
import AgenticCapabilityPanel from "@/components/agents/agentic-capability-panel";
import ExecutiveReportGenerator from "@/components/reports/executive-report-generator";

function metricClass(value: number) {
  if (value > 0) {
    return "text-amber-300";
  }

  if (value < 0) {
    return "text-red-300";
  }

  return "text-emerald-300";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function ExecutiveDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: ExecutiveSort;
    filter?: ExecutiveFilter;
    search?: string;
  }>;
}) {
  const allowed = await canAccess(["ADMIN", "EXECUTIVE"]);

  if (!allowed) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
          <h1 className="text-2xl font-bold text-white">
            Executive Dashboard access restricted
          </h1>
          <p className="mt-2 text-slate-400">
            This bird&apos;s-eye portfolio view is available to Admin and
            Executive roles only.
          </p>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const sort = params.sort ?? "variance";
  const filter = params.filter ?? "all";
  const search = params.search ?? "";
  const data = await getExecutiveDashboard({
    sort,
    filter,
    search,
  });

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-6 border-b border-slate-800 pb-5">
        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
          <Eye size={16} />
          Leadership View
        </div>
        <h1 className="text-3xl font-bold text-white">
          Executive Dashboard
        </h1>
        <p className="mt-2 max-w-3xl text-slate-400">
          Bird&apos;s-eye view of project health, delivery variance, overdue
          work, risk concentration, and historical portfolio records.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          ["Projects", data.summary.projects, "portfolio records"],
          ["Red Projects", data.summary.redProjects, "need attention"],
          ["Active SRs", data.summary.activeReviews, "in delivery"],
          ["Overdue SRs", data.summary.overdueReviews, "past due"],
          ["Hours", data.summary.allocatedHours, "allocated"],
          ["Variance", data.summary.variance, "hours vs expected"],
        ].map(([label, value, helper]) => (
          <div
            key={label as string}
            className="rounded-2xl border border-cyan-500/10 bg-slate-900/70 p-4"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              {label as string}
            </p>
            <p
              className={`mt-3 text-3xl font-black ${
                label === "Variance"
                  ? metricClass(value as number)
                  : "text-white"
              }`}
            >
              {value as number}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {helper as string}
            </p>
          </div>
        ))}
      </div>

      <section className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-emerald-300">
              <TrendingUp size={16} />
              Business Value / Productivity
            </div>
            <h2 className="text-xl font-bold text-white">
              AI governance time saved
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
              Pitch baseline: if every person in EYG saves{" "}
              {data.productivity.baselineDailyHoursPerPerson} hour/day, then{" "}
              {data.productivity.workdaysPerWeek} hrs/week/person ×{" "}
              {data.productivity.baselinePeople} people ={" "}
              {data.productivity.baselineWeeklyHoursSaved.toLocaleString()} hrs/week,
              or {data.productivity.baselineAnnualHoursSaved.toLocaleString()} hrs/year.
              Person-day conversion uses a real delivery calendar:{" "}
              {data.productivity.workdaysPerWeek} weekdays/week ×{" "}
              {data.productivity.workingWeeksPerYear} weeks ={" "}
              {data.productivity.annualWorkingDays} workdays/person/year,{" "}
              {data.productivity.workdayHours} hrs/day.
            </p>
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-200">
            {data.productivity.workdayHours} hrs/day · weekends off
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            [
              "Pitch annual hours",
              data.productivity.baselineAnnualHoursSaved.toLocaleString(),
              `${data.productivity.baselinePeople}-person assumption`,
            ],
            [
              "Pitch 9h person-days",
              data.productivity.baselineWorkingDaysSaved.toLocaleString(),
              `${data.productivity.baselineFteYearsSavedLabel} FTE-years equivalent`,
            ],
            [
              "Measured annual run-rate",
              data.productivity.measuredAnnualHoursSaved.toLocaleString(),
              `${data.productivity.measuredWeeklyHoursSaved} hrs/wk from app volumes`,
            ],
            [
              "Measured 9h person-days",
              data.productivity.measuredWorkingDaysSaved.toLocaleString(),
              `${data.productivity.measuredFteYearsSavedLabel} FTE-year equivalent`,
            ],
          ].map(([label, value, helper]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
            >
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-3xl font-black text-emerald-300">
                {value}
              </p>
              <p className="mt-1 text-xs text-slate-400">{helper}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-6 text-slate-300">
          <span className="font-semibold text-emerald-200">Reality check:</span>{" "}
          The measured value is not “people saved”; it is equivalent capacity.
          Current records show {data.productivity.measuredWeeklyHoursSaved} hrs/week
          saved across tracked workflows, which annualizes to{" "}
          {data.productivity.measuredAnnualHoursSaved.toLocaleString()} hrs/year ={" "}
          {data.productivity.measuredWorkingDaysSaved.toLocaleString()} nine-hour
          person-days, or {data.productivity.measuredFteYearsSavedLabel} FTE-year at{" "}
          {data.productivity.annualShiftHoursPerPerson.toLocaleString()} hrs/person/year.
          Calendar days remain {data.productivity.annualWorkingDays}/person/year;
          these values are cross-person effort capacity.
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {data.productivity.workflows.map((item) => (
            <div
              key={`${item.role}-${item.workflow}`}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{item.role}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.workflow}</p>
                </div>
                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
                  {item.weeklyHoursSaved}h/wk
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Volume {item.volume} × {item.hoursPerUnit} hrs/unit saved
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mb-6">
        <AgenticCapabilityPanel
          context="executive"
          runInline
          metrics={[
            {
              label: "Red projects",
              value: data.summary.redProjects,
            },
            {
              label: "Portfolio variance",
              value: `${data.summary.variance >= 0 ? "+" : ""}${data.summary.variance}h`,
            },
            {
              label: "Overdue SRs",
              value: data.summary.overdueReviews,
            },
          ]}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {data.trends.map((trend) => (
          <div
            key={trend.label}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                {trend.label}
              </p>
              <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[11px] font-semibold text-cyan-200">
                {trend.direction}
              </span>
            </div>
            <p className="mt-3 text-2xl font-black text-white">
              {trend.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {trend.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
        <h2 className="text-lg font-bold text-white">
          Leadership Insights
        </h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {data.insights.map((insight) => (
            <div
              key={insight}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-6 text-slate-300"
            >
              {insight}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">
              Retest Governance Insights
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Fix-readiness, assignment pressure, overdue retests, and
              extension signals from the retest queue.
            </p>
          </div>
          <Link
            href="/retest-governance"
            className="rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/10"
          >
            Open Retest Governance
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["Retests", data.retestSummary.total, "requests"],
            [
              "Controls",
              data.retestSummary.controlsInRetest,
              "in retest",
            ],
            [
              "Not Assigned",
              data.retestSummary.notAssigned,
              "need reviewer",
            ],
            ["In Progress", data.retestSummary.inProgress, "active"],
            ["Overdue", data.retestSummary.overdue, "past target"],
            [
              "Extensions",
              data.retestSummary.extensionNeeded,
              "need decision",
            ],
          ].map(([label, value, helper]) => (
            <div
              key={label as string}
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
            >
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                {label as string}
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {value as number}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {helper as string}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {data.retestInsights.map((insight) => (
            <div
              key={insight}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-6 text-slate-300"
            >
              {insight}
            </div>
          ))}
        </div>
      </div>

      <ExecutiveReportGenerator />

      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">
            Search records
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
            <Search size={16} className="text-slate-500" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Project, SPR, client, status..."
              className="w-64 bg-transparent text-sm text-white outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">
            Sort records
          </label>
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          >
            <option value="variance">Variance</option>
            <option value="risk">Risk score</option>
            <option value="overdue">Overdue SRs</option>
            <option value="updated">Recently updated</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">
            Filter records
          </label>
          <select
            name="filter"
            defaultValue={filter}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          >
            <option value="all">All records</option>
            <option value="active">Active projects</option>
            <option value="red">Red projects</option>
            <option value="completed">Completed projects</option>
          </select>
        </div>

        <button className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950">
          <Filter size={16} />
          Apply
        </button>

        <Link
          href="/executive"
          className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400/40"
        >
          Reset
        </Link>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-800 p-5">
          <BarChart3 className="text-cyan-300" size={22} />
          <div>
            <h2 className="text-xl font-bold text-white">
              Portfolio Records
            </h2>
            <p className="text-sm text-slate-400">
              Sort and filter older project records by variance, risk, overdue
              work, and update recency.
            </p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-950/70 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="p-4">Project</th>
              <th className="p-4">Risk</th>
              <th className="p-4">Reviews</th>
              <th className="p-4">Findings</th>
              <th className="p-4">Variance</th>
              <th className="p-4">Updated</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-slate-800"
              >
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {row.red && (
                      <TriangleAlert
                        size={16}
                        className="text-amber-300"
                      />
                    )}
                    <div>
                      <Link
                        href={`/projects/${row.id}`}
                        className="font-semibold text-white hover:text-cyan-200"
                      >
                        {row.name}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        {row.client} · {row.sprId} · {row.status}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <p className="font-bold text-cyan-300">
                    {row.riskScore}
                  </p>
                  <p className="text-xs text-slate-500">
                    {row.riskTier}
                  </p>
                </td>
                <td className="p-4 text-slate-300">
                  {row.activeReviews} active
                  <p className="text-xs text-red-300">
                    {row.overdueReviews} overdue
                  </p>
                  <p className="text-xs text-amber-300">
                    {row.pendingExtensions} extensions
                  </p>
                </td>
                <td className="p-4 text-slate-300">
                  {row.openFindings} open
                  <p className="text-xs text-red-300">
                    {row.criticalOpen} critical
                  </p>
                </td>
                <td className="p-4">
                  <p className={`font-bold ${metricClass(row.variance)}`}>
                    {row.variance >= 0 ? "+" : ""}
                    {row.variance}h
                  </p>
                  <p className="text-xs text-slate-500">
                    {row.allocatedHours}h / {row.expectedHours}h
                  </p>
                </td>
                <td className="p-4 text-slate-400">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} />
                    {formatDate(row.updatedAt)}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {row.latestReview}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
