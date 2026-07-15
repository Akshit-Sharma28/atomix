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
  ProductivitySource,
  ExecutiveSort,
  getExecutiveDashboard,
} from "@/services/dashboard/executive.service";
import AgenticCapabilityPanel from "@/components/agents/agentic-capability-panel";
import ExecutiveReportGenerator from "@/components/reports/executive-report-generator";
import ProductivitySettingsForm from "@/components/executive/productivity-settings-form";

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

function percentChange(current: number, baseline: number) {
  if (baseline === 0) return current === 0 ? 0 : null;
  return ((current - baseline) / baseline) * 100;
}

function trendLabel(current: number, baseline: number) {
  const change = percentChange(current, baseline);
  if (change === null) return "New baseline";
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
}

function trendClass(current: number, baseline: number) {
  return current >= baseline ? "text-emerald-300" : "text-amber-300";
}

export default async function ExecutiveDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: ExecutiveSort;
    filter?: ExecutiveFilter;
    search?: string;
    source?: ProductivitySource;
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
  const productivitySource = params.source === "live" ? "live" : "scenario";
  const data = await getExecutiveDashboard({
    sort,
    filter,
    search,
    productivitySource,
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

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
            Live portfolio health
          </p>
          <h2 className="mt-1 text-xl font-bold text-white">Delivery KPIs</h2>
        </div>
        <p className="max-w-2xl text-right text-xs leading-5 text-slate-500">
          Current database values. These describe delivery health and are separate
          from the modeled capacity opportunity below.
        </p>
      </div>

      <div className="mb-3 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          ["Projects", data.summary.projects, "Portfolio records", "All SPRs currently in the executive portfolio."],
          ["Red Projects", data.summary.redProjects, "Need attention", "Projects with overdue work, critical open findings, or pending extensions."],
          ["Active SRs", data.summary.activeReviews, "In delivery", "Security reviews in an active workflow status."],
          ["Overdue SRs", data.summary.overdueReviews, "Past due", "Active security reviews beyond their committed due date."],
          ["Allocated Hours", data.summary.allocatedHours, "Current assignments", "Hours assigned to reviewers across active SRs."],
          ["Variance", data.summary.variance, "Allocated − expected", "Difference between allocated hours and the 16-hour baseline per active SR."],
        ].map(([label, value, helper, definition]) => (
          <div
            key={label as string}
            className="group rounded-2xl border border-cyan-500/10 bg-slate-900/70 p-4"
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
            <p className="mt-3 border-t border-slate-800 pt-3 text-[11px] leading-4 text-slate-600 group-hover:text-slate-400">
              {definition as string}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-x-5 gap-y-2 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-xs text-slate-400">
        <span><strong className="text-slate-200">Expected-hours baseline:</strong> 16h per active SR</span>
        <span><strong className="text-slate-200">Red trigger:</strong> delivery, risk, or extension exception</span>
        <span><strong className="text-slate-200">Data type:</strong> live operational records</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
        <div>
          <p className="text-sm font-semibold text-white">Productivity data source</p>
          <p className="mt-1 text-xs text-slate-500">
            Switch between editable planning inputs and dated operational records.
          </p>
        </div>
        <div className="flex rounded-xl border border-slate-700 bg-slate-900 p-1">
          {[
            ["scenario", "Saved Scenario"],
            ["live", "Live Database"],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={`/executive?source=${value}`}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                productivitySource === value
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <ProductivitySettingsForm settings={data.productivity.settings} />

      <section className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-emerald-300">
              <TrendingUp size={16} />
              Modeled business value / productivity
            </div>
            <h2 className="text-xl font-bold text-white">
              AI-enabled capacity opportunity
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
              Full-adoption scenario for {data.productivity.adoptionUsers} users
              saving {data.productivity.adoptionHoursSavedPerUserPerDay} hour per
              working day. Calculations use {data.productivity.workdayHours}-hour
              days, {data.productivity.workweekHours}-hour weeks, and{" "}
              {data.productivity.fteAnnualWorkingHours.toLocaleString()} annual
              working hours per FTE. This is modeled released capacity, not a
              realized headcount reduction.
            </p>
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-200">
            {data.productivity.workweekHours} hrs/week · {data.productivity.workdayHours} hrs/day
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            [
              "Annual hours released",
              data.productivity.adoptionAnnualHoursSaved.toLocaleString(),
              "Primary capacity KPI",
            ],
            [
              "Equivalent FTE capacity",
              data.productivity.adoptionFteEquivalent.toFixed(1),
              `${data.productivity.fteAnnualWorkingHours.toLocaleString()} hours per FTE-year`,
            ],
            [
              "Hours saved per week",
              data.productivity.adoptionWeeklyHoursSaved.toLocaleString(),
              `${data.productivity.adoptionUsers} users × 1h/day × 5 days`,
            ],
            [
              `${data.productivity.workdayHours}-hour workdays saved`,
              Math.round(data.productivity.adoptionWorkingDaysSaved).toLocaleString(),
              "Equivalent person-days",
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

        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-slate-950/70 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white">Capacity calculation bridge</p>
            <span className="rounded-full bg-amber-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-200">
              Scenario · not realized savings
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Adoption", `${data.productivity.adoptionUsers} users`, "Planning population"],
              ["Daily", `${data.productivity.adoptionDailyHoursSaved} hrs`, `${data.productivity.adoptionUsers} users × ${data.productivity.adoptionHoursSavedPerUserPerDay} hour`],
              ["Weekly", `${data.productivity.adoptionWeeklyHoursSaved} hrs`, `Daily × ${data.productivity.workdaysPerWeek} days`],
              ["Monthly avg.", `${Math.round(data.productivity.adoptionMonthlyHoursSaved).toLocaleString()} hrs`, "Annual ÷ 12"],
              ["Annual", `${data.productivity.adoptionAnnualHoursSaved.toLocaleString()} hrs`, `Weekly × ${data.productivity.workingWeeksPerYear} weeks`],
            ].map(([label, value, formula]) => (
              <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
                <p className="mt-1 text-lg font-bold text-emerald-300">{value}</p>
                <p className="mt-1 text-[11px] text-slate-500">{formula}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
            <span><strong className="text-white">{Math.round(data.productivity.adoptionWorkingDaysSaved).toLocaleString()}</strong> equivalent {data.productivity.workdayHours}-hour workdays</span>
            <span><strong className="text-white">{Math.round(data.productivity.adoptionAnnualHoursSaved / data.productivity.workweekHours).toLocaleString()}</strong> equivalent {data.productivity.workweekHours}-hour work weeks</span>
            <span><strong className="text-white">{data.productivity.adoptionFteEquivalent.toFixed(1)}</strong> FTE capacity at {data.productivity.fteAnnualWorkingHours.toLocaleString()} hours/FTE-year</span>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {[
            {
              eyebrow: "Week-over-week",
              title: "This week vs last week",
              baseline: data.productivity.comparisons.lastWeek,
              currentUsers: data.productivity.adoptionUsers,
              baselineReviews:
                productivitySource === "live"
                  ? data.productivity.comparisons.lastWeek.volumes.dedicated + data.productivity.comparisons.lastWeek.volumes.augmentation
                  : data.productivity.settings.lastWeekDedicatedReviews + data.productivity.settings.lastWeekAugmentationReviews,
              baselinePeerReviews: productivitySource === "live" ? data.productivity.comparisons.lastWeek.volumes.peer : data.productivity.settings.lastWeekPeerReviews,
              baselineRetests: productivitySource === "live" ? data.productivity.comparisons.lastWeek.volumes.retests : data.productivity.settings.lastWeekRetests,
              currentReviews: data.productivity.newReviewsPerWeek,
              multiplier: 1,
              periodLabel: "hrs/week",
            },
            {
              eyebrow: "Year-over-year run rate",
              title: "This year vs last year",
              baseline: data.productivity.comparisons.lastYear,
              currentUsers: data.productivity.adoptionUsers,
              baselineReviews:
                productivitySource === "live"
                  ? data.productivity.comparisons.lastYear.volumes.dedicated + data.productivity.comparisons.lastYear.volumes.augmentation
                  : data.productivity.settings.lastYearDedicatedReviews + data.productivity.settings.lastYearAugmentationReviews,
              baselinePeerReviews: productivitySource === "live" ? data.productivity.comparisons.lastYear.volumes.peer : data.productivity.settings.lastYearPeerReviews,
              baselineRetests: productivitySource === "live" ? data.productivity.comparisons.lastYear.volumes.retests : data.productivity.settings.lastYearRetests,
              currentReviews: data.productivity.newReviewsPerWeek,
              multiplier: data.productivity.workingWeeksPerYear,
              periodLabel: "hrs/year",
            },
          ].map((comparison) => {
            const currentOperational =
              data.productivity.measuredWeeklyHoursSaved * comparison.multiplier;
            const baselineOperational =
              comparison.baseline.operationalWeeklyHours * comparison.multiplier;
            return (
              <div key={comparison.title} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300">
                  {comparison.eyebrow}
                </p>
                <h3 className="mt-1 text-base font-bold text-white">{comparison.title}</h3>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {[
                    ["Hours released", currentOperational, baselineOperational, comparison.periodLabel],
                    ["Users", comparison.currentUsers, comparison.baseline.users, "people"],
                    ["Pool reviews", comparison.currentReviews, comparison.baselineReviews, "reviews/wk"],
                    [
                      "Peer reviews",
                      productivitySource === "live" ? data.productivity.liveVolumes.current.peer : data.productivity.settings.peerReviewsPerWeek,
                      comparison.baselinePeerReviews,
                      "reviews/wk",
                    ],
                    [
                      "Retests",
                      productivitySource === "live" ? data.productivity.liveVolumes.current.retests : data.productivity.settings.retestsPerWeek,
                      comparison.baselineRetests,
                      "retests/wk",
                    ],
                  ].map(([label, current, baseline, unit]) => (
                    <div key={label as string} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                      <p className="text-[11px] text-slate-500">{label as string}</p>
                      <p className="mt-1 text-lg font-bold text-white">
                        {(current as number).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      </p>
                      <p className="text-[10px] text-slate-600">{unit as string}</p>
                      <p className={`mt-2 text-xs font-bold ${trendClass(current as number, baseline as number)}`}>
                        {trendLabel(current as number, baseline as number)}
                        <span className="ml-1 font-normal text-slate-500">vs {Number(baseline).toLocaleString()}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-6 text-slate-300">
            <span className="font-semibold text-emerald-200">Executive framing:</span>{" "}
            At full adoption, {data.productivity.adoptionDailyHoursSaved.toLocaleString()} hours released each working day becomes{" "}
            {data.productivity.adoptionAnnualHoursSaved.toLocaleString()} hours per
            year, or approximately {data.productivity.adoptionFteEquivalent.toFixed(1)}{" "}
            FTEs of capacity using the 2,025-hour annual convention.
          </div>
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4 text-sm leading-6 text-slate-300">
            <span className="font-semibold text-cyan-200">Value beyond FTE:</span>{" "}
            quality gates, fewer missed controls, faster evidence readiness,
            better SLA governance, reusable review memory, and less rework.
          </div>
        </div>

        <div className="mt-6 border-t border-emerald-500/20 pt-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
            Operational productivity model
          </p>
          <h3 className="mt-1 text-lg font-bold text-white">
            Hours saved mapping by user role
          </h3>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
            Average weekly model for {data.productivity.newReviewsPerWeek} new EYG
            reviews. Each row maps a workflow owner to volume, the assumed saving
            per review, weekly capacity released, and its annual equivalent.
          </p>
        </div>

        <details open className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
          <summary className="cursor-pointer text-sm font-semibold text-amber-100">
            Show the 25-review role calculation
          </summary>
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-sm font-semibold text-white">
              Role assumptions and weekly calculation
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              This model uses {data.productivity.dedicatedReviewsPerWeek} Dedicated
              pool reviews, {data.productivity.augmentationReviewsPerWeek}{" "}
              Augmentation pool reviews, {data.productivity.settings.peerReviewsPerWeek}{" "}
              peer reviews, and {data.productivity.settings.retestsPerWeek} retests
              each week. Governance volume follows the total pool-review volume.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
                  <tr className="border-b border-slate-800">
                    <th className="py-2 pr-3">Workflow</th>
                    <th className="py-2 pr-3">Role</th>
                    <th className="py-2 pr-3 text-right">Volume</th>
                    <th className="py-2 pr-3 text-right">Assumption</th>
                    <th className="py-2 text-right">Weekly estimate</th>
                    <th className="py-2 text-right">Annual estimate</th>
                    <th className="py-2 text-right">% of 45h week</th>
                  </tr>
                </thead>
                <tbody>
                  {data.productivity.workflows.map((item) => (
                    <tr
                      key={`${item.role}-${item.workflow}`}
                      className="border-b border-slate-900 text-slate-300 last:border-0"
                    >
                      <td className="py-3 pr-3 font-medium text-white">
                        {item.workflow}
                      </td>
                      <td className="py-3 pr-3 text-slate-400">
                        {item.role}
                      </td>
                      <td className="py-3 pr-3 text-right">
                        {item.volume}
                      </td>
                      <td className="py-3 pr-3 text-right">
                        {item.hoursPerUnit}h/item
                      </td>
                      <td className="py-3 text-right font-semibold text-cyan-200">
                        {item.weeklyHoursSaved}h/wk
                      </td>
                      <td className="py-3 text-right font-semibold text-emerald-200">
                        {item.annualHoursSaved.toLocaleString()}h/yr
                      </td>
                      <td className="py-3 text-right text-slate-400">
                        {item.workweekCapacityPercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Total weekly estimate:{" "}
              {data.productivity.workflows
                .map((item) => item.weeklyHoursSaved)
                .join(" + ")}{" "}
              ={" "}
              <span className="font-semibold text-cyan-200">
                {data.productivity.measuredWeeklyHoursSaved.toLocaleString()} hrs/week
              </span>
              .
            </p>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm font-semibold text-white">
                Estimated current annualized capacity
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {data.productivity.measuredWeeklyHoursSaved} hrs/week ×{" "}
                {data.productivity.workingWeeksPerYear} weeks ={" "}
                {data.productivity.measuredAnnualHoursSaved.toLocaleString()}{" "}
                hrs/year ÷ {data.productivity.workdayHours} hrs/day ={" "}
                {data.productivity.measuredWorkingDaysSaved.toLocaleString()}{" "}
                person-days.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm font-semibold text-white">
                Capacity conversion
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {data.productivity.measuredAnnualHoursSaved.toLocaleString()} hrs/year ÷{" "}
                {data.productivity.fteAnnualWorkingHours.toLocaleString()} hrs per
                45-hour-week FTE-year = {data.productivity.measuredFteYearsSavedLabel}{" "}
                FTE-years of released capacity.
              </p>
            </div>
          </div>
        </details>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                  {item.weeklyHoursSaved.toLocaleString()}h/wk
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Volume {item.volume.toLocaleString()} × {item.hoursPerUnit} hrs/unit
                · {item.annualHoursSaved.toLocaleString()}h/year ·{" "}
                {item.annualWorkingDaysSaved.toFixed(1)} days/year
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
