import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Bot,
  CalendarClock,
  Clock3,
  FileText,
  FolderPlus,
  Shield,
  TrendingDown,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";

import KPIGrid from "@/components/dashboard/kpi-grid";
import ProjectRiskTable from "@/components/dashboard/project-risk-table";
import DashboardCharts from "@/components/dashboard/charts";
import WorkloadTable from "@/components/dashboard/workload-table";
import OllamaStatus from "@/components/ai/ollama-status";
import TopRiskChart from "@/components/dashboard/top-risk-chart";
import UserMenu from "@/components/users/user-menu";

import { getDashboardMetrics } from "@/services/dashboard/dashboard.service";
import { getProjectRiskSummary } from "@/services/dashboard/project-risk.service";
import { getDeveloperWorkload } from "@/services/dashboard/workload.service";
import { getGovernanceDashboard } from "@/services/dashboard/governance.service";

function formatDate(date?: Date | null) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function trendColor(trend: string) {
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

export default async function DashboardPage() {
  const [
    metrics,
    projects,
    workload,
    governance,
  ] = await Promise.all([
    getDashboardMetrics(),
    getProjectRiskSummary(),
    getDeveloperWorkload(),
    getGovernanceDashboard(),
  ]);

  return (
    <div className="w-full px-8 py-6">
      <div className="-ml-8 mb-6 border-b border-slate-800 pb-5 pl-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Shield size={28} className="text-cyan-400" />
              <h1 className="text-3xl font-bold text-white">
                Pentest Governance Dashboard
              </h1>
            </div>
            <p className="mt-2 max-w-3xl text-slate-400">
              APIM, SPR, and SR context organized into delivery governance:
              reviewer capacity, peer review, SLA, chargeability, red
              engagements, and executive execution signals.
            </p>
          </div>

          <UserMenu />
        </div>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
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
              className={`mt-2 text-xs font-semibold uppercase ${trendColor(
                kpi.trend
              )}`}
            >
              {kpi.trend}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-5">
        <KPIGrid metrics={metrics} />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {[
          ["New Project", FolderPlus, "/projects"],
          ["Import Scope Data", Upload, "/import"],
          ["Generate Exec Pack", FileText, "/reports"],
          ["Open SLA Workbench", Clock3, "/sla"],
        ].map(([label, Icon, href]) => {
          const ActionIcon = Icon as typeof FolderPlus;

          return (
            <Link
              key={label as string}
              href={href as string}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 font-semibold transition-all hover:border-cyan-500/30"
            >
              <ActionIcon size={16} />
              {label as string}
            </Link>
          );
        })}
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-cyan-500/10 bg-slate-900/60 p-4">
          <div className="mb-3 flex items-center gap-3">
            <Users size={20} className="text-cyan-400" />
            <h2 className="text-lg font-bold">
              Reviewer Pool Availability
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
            {governance.reviewerPool.length === 0 && (
              <p className="text-sm text-slate-400">
                No reviewer profiles found. Add reviewer profiles to activate
                the pool view.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-500/10 bg-slate-900/60 p-4">
          <div className="mb-3 flex items-center gap-3">
            <AlertTriangle size={20} className="text-amber-300" />
            <h2 className="text-lg font-bold">
              Red Engagements
            </h2>
          </div>
          <div className="space-y-3">
            {governance.activeReviews
              .filter((review) => review.isOverdue)
              .slice(0, 5)
              .map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-red-500/20 bg-red-950/20 p-3"
                >
                  <p className="font-semibold text-white">
                    {review.project}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {review.title}
                  </p>
                  <p className="mt-2 text-xs text-red-200">
                    {review.sprId} · {review.srId} · due{" "}
                    {formatDate(review.dueDate)}
                  </p>
                </div>
              ))}
            {governance.activeReviews.filter((review) => review.isOverdue)
              .length === 0 && (
              <p className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-sm text-emerald-200">
                No overdue active security reviews.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-500/10 bg-slate-900/60 p-4">
          <div className="mb-3 flex items-center gap-3">
            <Bot size={20} className="text-cyan-400" />
            <h2 className="text-lg font-bold">
              Agentic Capability
            </h2>
          </div>
          <OllamaStatus />
          <div className="mt-4 grid gap-2">
            {[
              "Governance Agent: flags overdue SRs, capacity risk, and extension needs.",
              "Executive Agent: turns delivery state into leadership narratives.",
              "Peer Review Agent: assists QA reviewers with evidence and consistency checks.",
              "Pentest Copilot Agent: helps consultants draft findings and remediation.",
            ].map((agent) => (
              <div
                key={agent}
                className="rounded-xl bg-slate-800/80 px-3 py-2 text-sm text-slate-200"
              >
                {agent}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
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
                  <tr
                    key={review.id}
                    className="border-t border-slate-800"
                  >
                    <td className="p-3 text-slate-300">
                      <span className="block text-xs text-slate-500">
                        APIM grouped
                      </span>
                      {review.sprId} · {review.srId}
                    </td>
                    <td className="p-3 text-white">
                      {review.project}
                    </td>
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
              APIM / SPR / SR Operating Model
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
          <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-4 text-sm leading-6 text-slate-300">
            Atomix is the execution cockpit: it shows who can take work, what
            changed this week, where peer review is stuck, which SRs are red,
            and where leadership needs to unblock delivery.
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Analytics
        </h2>
        <span className="text-xs text-slate-500">
          Last 6 Months
        </span>
      </div>

      <DashboardCharts />

      <div className="mt-6">
        <WorkloadTable users={workload} />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-cyan-400" size={22} />
            <h2 className="text-2xl font-bold text-white">
              Project Risk Overview
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <TrendingDown size={14} />
            variance is derived from active review allocation until timesheet
            integration is connected
          </div>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <TopRiskChart projects={projects} />
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <h3 className="mb-3 font-bold text-white">
              Rescheduled Projects
            </h3>
            <div className="space-y-3">
              {governance.rescheduled.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-slate-800 p-3"
                >
                  <p className="font-semibold text-white">
                    {review.project}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {review.sprId} · {review.srId}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    moved from {formatDate(review.requestedStartDate)} to{" "}
                    {formatDate(review.actualStartDate)}
                  </p>
                </div>
              ))}
              {governance.rescheduled.length === 0 && (
                <p className="text-sm text-slate-400">
                  No rescheduled SRs found in the current board.
                </p>
              )}
            </div>
          </div>
        </div>

        <ProjectRiskTable projects={projects} />
      </div>
    </div>
  );
}
