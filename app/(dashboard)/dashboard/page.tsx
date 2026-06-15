import KPIGrid from "@/components/dashboard/kpi-grid";
import ProjectRiskTable from "@/components/dashboard/project-risk-table";
import DashboardCharts from "@/components/dashboard/charts";
import WorkloadTable from "@/components/dashboard/workload-table";
import OllamaStatus from "@/components/ai/ollama-status";

import { getDashboardMetrics } from "@/services/dashboard/dashboard.service";
import { getProjectRiskSummary } from "@/services/dashboard/project-risk.service";
import { getDeveloperWorkload } from "@/services/dashboard/workload.service";

import TopRiskChart from "@/components/dashboard/top-risk-chart";

import {
  Activity,
  TrendingUp,
  AlertTriangle,
  Shield,
  Plus,
  FileText,
  Upload,
  FolderPlus,
  Bot,
} from "lucide-react";

import UserMenu from "@/components/users/user-menu";

export default async function DashboardPage() {
  const [
    metrics,
    projects,
    workload,
  ] = await Promise.all([
    getDashboardMetrics(),
    getProjectRiskSummary(),
    getDeveloperWorkload(),
  ]);

  return (
    <div
      className="
      w-full
      px-8
      py-6
      "
    >
      {/* Header */}

      <div
        className="
        mb-6
        pb-5
        border-b
        border-slate-800
        -ml-8
        pl-8
        "
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <Shield size={28} className="text-cyan-400" />

              <h1
                className="
                text-3xl
                font-bold
                text-white
                "
              >
                Security Dashboard
              </h1>
            </div>

            <p
              className="
              text-slate-400
              mt-2
              "
            >
              Executive overview of projects, findings, workloads and risk
              posture.
            </p>
          </div>

          <UserMenu />
        </div>
      </div>

      {/* KPI GRID */}

      <div className="mb-5">
        <KPIGrid metrics={metrics} />
      </div>

      {/* Quick Actions */}

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          className="
          flex
          items-center
          gap-2
          px-4
          py-2.5
          rounded-xl
          bg-cyan-500
          text-black
          font-semibold
          hover:bg-cyan-400
          transition-all
          "
        >
          <Plus size={16} />
          New Finding
        </button>

        <button
          className="
          flex
          items-center
          gap-2
          px-4
          py-2.5
          rounded-xl
          bg-slate-900/60
          border
          border-slate-800
          hover:border-cyan-500/30
          transition-all
          "
        >
          <FolderPlus size={16} />
          New Project
        </button>

        <button
          className="
          flex
          items-center
          gap-2
          px-4
          py-2.5
          rounded-xl
          bg-slate-900/60
          border
          border-slate-800
          hover:border-cyan-500/30
          transition-all
          "
        >
          <FileText size={16} />
          Generate Report
        </button>

        <button
          className="
          flex
          items-center
          gap-2
          px-4
          py-2.5
          rounded-xl
          bg-slate-900/60
          border
          border-slate-800
          hover:border-cyan-500/30
          transition-all
          "
        >
          <Upload size={16} />
          Import Scan
        </button>
      </div>

      {/* Executive Insights */}

      <div className="grid lg:grid-cols-3 gap-6 mb-6 items-stretch">
        <div
          className="
          bg-slate-900/60
          border
          border-cyan-500/10
          rounded-2xl
          p-4
          h-full
          "
        >
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp size={20} className="text-cyan-400" />

            <h2 className="text-lg font-bold">Security Posture</h2>
          </div>

          <OllamaStatus />

          <p className="text-slate-300 mt-4">
            Current environment contains{" "}
            <span className="text-cyan-400 font-semibold">{metrics.total}</span>{" "}
            tracked findings with{" "}
            <span className="text-red-400 font-semibold">
              {metrics.critical}
            </span>{" "}
            critical vulnerabilities.
          </p>
        </div>

       <TopRiskChart projects={projects} />

        <div
          className="
        bg-slate-900/60
        border
        border-cyan-500/10
        rounded-2xl
        p-4
        h-full
        "
        >
         <div className="flex items-center gap-3 mb-4">
  <Bot
    size={20}
    className="text-cyan-400"
  />

  <h2 className="text-lg font-bold">
    Atomix Copilot
  </h2>
</div>

          <p
            className="
    text-slate-400
    text-sm
    mb-4
    "
          >
            AI-assisted security operations.
          </p>

          <div className="space-y-2">
            <button
              className="
      w-full
      text-left
      px-3
      py-2
      rounded-lg
      bg-slate-800
      hover:bg-slate-700
      transition-all
      "
            >
              Generate Pentest Report
            </button>

            <button
              className="
      w-full
      text-left
      px-3
      py-2
      rounded-lg
      bg-slate-800
      hover:bg-slate-700
      transition-all
      "
            >
              Review Findings
            </button>

            <button
              className="
      w-full
      text-left
      px-3
      py-2
      rounded-lg
      bg-slate-800
      hover:bg-slate-700
      transition-all
      "
            >
              Suggest Remediation
            </button>

            <button
              className="
      w-full
      text-left
      px-3
      py-2
      rounded-lg
      bg-slate-800
      hover:bg-slate-700
      transition-all
      "
            >
              Analyze Risk Posture
            </button>
          </div>
        </div>
      </div>

      <div
        className="
              flex
              items-center
              justify-between
              mb-3
              "
      >
        <h2
          className="
                text-lg
                font-semibold
                text-white
                "
        >
          Analytics
        </h2>

        <span
          className="
                text-xs
                text-slate-500
                "
        >
          Last 6 Months
        </span>
      </div>

      {/* Charts */}

      <DashboardCharts />

      {/* Workload */}

      <div className="mt-6">
        <WorkloadTable users={workload} />
      </div>

      {/* Project Risk */}

      <div
        className="
  mt-6
  bg-slate-900
  border
  border-slate-800
  rounded-2xl
  p-4
  "
      >
        <div
          className="
    flex
    items-center
    justify-between
    mb-5
    "
        >
          <div className="flex items-center gap-3">
            <Activity className="text-cyan-400" size={22} />

            <h2
              className="
        text-2xl
        font-bold
        text-white
        "
            >
              Project Risk Overview
            </h2>
          </div>

          <button
            className="
      text-sm
      text-cyan-400
      hover:text-cyan-300
      transition-colors
      "
          >
            View All Projects →
          </button>
        </div>

        <ProjectRiskTable projects={projects} />
      </div>
    </div>
  );
}
