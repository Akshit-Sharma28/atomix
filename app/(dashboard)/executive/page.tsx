import Link from "next/link";
import {
  BarChart3,
  Eye,
  Filter,
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
  const data = await getExecutiveDashboard({
    sort,
    filter,
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

      <div className="mb-6">
        <AgenticCapabilityPanel
          context="executive"
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

      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
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
