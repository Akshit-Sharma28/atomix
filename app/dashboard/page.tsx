import KPIGrid from "../../components/dashboard/kpi-grid";
import ProjectRiskTable from "../../components/dashboard/project-risk-table";
import DashboardCharts from "../../components/dashboard/charts";
import WorkloadTable from "../../components/dashboard/workload-table";
import OllamaStatus
from "../../components/ai/ollama-status";

import {
  getDashboardMetrics,
} from "../../services/dashboard/dashboard.service";

import {
  getProjectRiskSummary,
} from "../../services/dashboard/project-risk.service";

import {
  getDeveloperWorkload,
} from "../../services/dashboard/workload.service";

import {
  Shield,
  Activity,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

export default async function DashboardPage() {
  const metrics =
    await getDashboardMetrics();

  const projects =
    await getProjectRiskSummary();

  const workload =
    await getDeveloperWorkload();

  const highestRiskProject =
    projects.length > 0
      ? [...projects].sort(
          (a, b) =>
            b.riskScore - a.riskScore
        )[0]
      : null;

  return (
    <div className="max-w-7xl mx-auto p-8">

      {/* Header */}

      <div className="mb-10">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-4">

            <Shield
              size={42}
              className="text-cyan-400"
            />

            <div>

              <h1 className="text-5xl font-bold text-white">
                Atomix
              </h1>

              <p className="text-slate-400 mt-2">
                Executive Security Dashboard
              </p>

            </div>

          </div>

          <div
            className="
            hidden
            lg:flex
            items-center
            gap-2
            bg-cyan-500/10
            border
            border-cyan-500/20
            px-4
            py-2
            rounded-xl
            "
          >
            <Activity
              size={18}
              className="text-cyan-400"
            />

            <span className="text-cyan-400 text-sm">
              Platform Active
            </span>

          </div>

        </div>

      </div>

      {/* KPI GRID */}

      <div className="mb-10">
        <KPIGrid metrics={metrics} />
      </div>

      {/* Executive Insights */}

      <div className="grid lg:grid-cols-2 gap-6 mb-10">

        <div
          className="
          bg-slate-900
          border
          border-cyan-500/10
          rounded-2xl
          p-6
          "
        >
          <div className="flex items-center gap-3 mb-4">

            <TrendingUp
              size={22}
              className="text-cyan-400"
            />

            <h2 className="text-xl font-bold">
              Security Posture
            </h2>

          </div>
          
            <div>

              <OllamaStatus />
            </div>


          <p className="text-slate-300">
            Current environment contains
            {" "}
            <span className="text-cyan-400 font-semibold">
              {metrics.total}
            </span>
            {" "}
            tracked findings with
            {" "}
            <span className="text-red-400 font-semibold">
              {metrics.critical}
            </span>
            {" "}
            critical vulnerabilities.
          </p>

        </div>

        <div
          className="
          bg-slate-900
          border
          border-red-500/10
          rounded-2xl
          p-6
          "
        >
          <div className="flex items-center gap-3 mb-4">

            <AlertTriangle
              size={22}
              className="text-red-400"
            />

            <h2 className="text-xl font-bold">
              Highest Risk Project
            </h2>

          </div>

          {highestRiskProject ? (
            <>
              <p className="text-white font-semibold">
                {highestRiskProject.name}
              </p>

              <p className="text-slate-400 mt-2">
                Risk Score:
                {" "}
                <span className="text-red-400">
                  {highestRiskProject.riskScore}
                </span>
              </p>

              <p className="text-slate-400">
                Open Findings:
                {" "}
                {highestRiskProject.openCount}
              </p>
            </>
          ) : (
            <p className="text-slate-400">
              No project data available
            </p>
          )}

        </div>

      </div>

      {/* CHARTS */}

      <DashboardCharts />

      {/* WORKLOAD */}

      <div className="mt-10">
        <WorkloadTable
          users={workload}
        />
      </div>

      {/* PROJECT RISK */}

      <div
        className="
        mt-10
        bg-slate-900
        border
        border-slate-800
        rounded-2xl
        p-6
        "
      >
        <div className="flex items-center gap-3 mb-6">

          <Activity
            className="text-cyan-400"
            size={24}
          />

          <h2 className="text-2xl font-bold text-white">
            Project Risk Overview
          </h2>

        </div>

        <ProjectRiskTable
          projects={projects}
        />

      </div>

    </div>
  );
}