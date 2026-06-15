import Link from "next/link";
import {
  Activity,
  Bot,
  FileText,
  FolderPlus,
  Shield,
  TrendingUp,
  Upload,
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

export default async function DashboardPage() {
  const [metrics, projects, workload] = await Promise.all([
    getDashboardMetrics(),
    getProjectRiskSummary(),
    getDeveloperWorkload(),
  ]);

  return (
    <div className="w-full px-8 py-6">
      <div className="-ml-8 mb-6 border-b border-slate-800 pb-5 pl-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Shield size={28} className="text-cyan-400" />
              <h1 className="text-3xl font-bold text-white">
                Dashboard
              </h1>
            </div>
            <p className="mt-2 max-w-3xl text-slate-400">
              Operational snapshot of projects, findings, risk posture, AI
              availability, and remediation progress.
            </p>
          </div>

          <UserMenu />
        </div>
      </div>

      <div className="mb-5">
        <KPIGrid metrics={metrics} />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {[
          ["New Project", FolderPlus, "/projects"],
          ["Import Scan", Upload, "/import"],
          ["Generate Report", FileText, "/reports"],
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

      <div className="mb-6 grid items-stretch gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-cyan-500/10 bg-slate-900/60 p-4">
          <div className="mb-3 flex items-center gap-3">
            <TrendingUp size={20} className="text-cyan-400" />
            <h2 className="text-lg font-bold">
              Security Posture
            </h2>
          </div>

          <OllamaStatus />

          <p className="mt-4 text-slate-300">
            Current environment contains{" "}
            <span className="font-semibold text-cyan-400">
              {metrics.total}
            </span>{" "}
            tracked findings with{" "}
            <span className="font-semibold text-red-400">
              {metrics.critical}
            </span>{" "}
            critical vulnerabilities.
          </p>
        </div>

        <TopRiskChart projects={projects} />

        <div className="rounded-2xl border border-cyan-500/10 bg-slate-900/60 p-4">
          <div className="mb-4 flex items-center gap-3">
            <Bot size={20} className="text-cyan-400" />
            <h2 className="text-lg font-bold">
              Atomix Copilot
            </h2>
          </div>

          <p className="mb-4 text-sm text-slate-400">
            AI-assisted security operations for finding triage, remediation
            wording, summaries, and report drafting.
          </p>

          <div className="space-y-2">
            {[
              "Generate Pentest Report",
              "Review Findings",
              "Suggest Remediation",
              "Analyze Risk Posture",
            ].map((item) => (
              <Link
                key={item}
                href="/copilot"
                className="block rounded-lg bg-slate-800 px-3 py-2 text-left transition-all hover:bg-slate-700"
              >
                {item}
              </Link>
            ))}
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
            <Activity className="text-cyan-400" size={22} />
            <h2 className="text-2xl font-bold text-white">
              Project Risk Overview
            </h2>
          </div>

          <Link
            href="/projects"
            className="text-sm text-cyan-400 transition-colors hover:text-cyan-300"
          >
            View All Projects →
          </Link>
        </div>

        <ProjectRiskTable projects={projects} />
      </div>
    </div>
  );
}
