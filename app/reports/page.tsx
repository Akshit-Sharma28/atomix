import { prisma } from "../../lib/prisma";
import {
  FileText,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Download,
} from "lucide-react";

export default async function ReportsPage() {
  const findings = await prisma.finding.findMany({
    include: {
      project: true,
      analysis: true,
    },
  });

  const projects =
    await prisma.project.findMany();

  const criticalCount =
    findings.filter(
      (f) => f.severity === "Critical"
    ).length;

  const highCount =
    findings.filter(
      (f) => f.severity === "High"
    ).length;

  const openCount =
    findings.filter(
      (f) => f.status !== "Closed"
    ).length;

  const averageRiskScore =
    findings.length > 0
      ? Math.round(
          findings.reduce(
            (sum, finding) =>
              sum +
              (finding.analysis
                ?.riskScore || 0),
            0
          ) / findings.length
        )
      : 0;

  const recentCriticalFindings =
    findings
      .filter(
        (f) =>
          f.severity === "Critical"
      )
      .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto p-8">

      {/* Header */}

      <div className="flex items-center justify-between mb-10">

        <div className="flex items-center gap-4">

          <FileText
            size={40}
            className="text-cyan-400"
          />

          <div>

            <h1 className="text-5xl font-bold text-white">
              Executive Reports
            </h1>

            <p className="text-slate-400 mt-2">
              Security posture overview
            </p>

          </div>

        </div>

        <button
          className="
          flex
          items-center
          gap-2
          bg-cyan-500
          hover:bg-cyan-400
          text-slate-950
          px-5
          py-3
          rounded-xl
          font-semibold
          transition-all
          "
        >
          <Download size={18} />
          Export PDF
        </button>

      </div>

      {/* KPI Cards */}

      <div className="grid md:grid-cols-4 gap-6 mb-8">

        <div
          className="
          bg-slate-900
          border
          border-slate-800
          rounded-2xl
          p-6
          "
        >
          <ShieldAlert
            className="text-red-400 mb-4"
            size={24}
          />

          <p className="text-slate-400">
            Critical Findings
          </p>

          <h2 className="text-5xl font-bold text-red-400">
            {criticalCount}
          </h2>
        </div>

        <div
          className="
          bg-slate-900
          border
          border-slate-800
          rounded-2xl
          p-6
          "
        >
          <AlertTriangle
            className="text-orange-400 mb-4"
            size={24}
          />

          <p className="text-slate-400">
            High Findings
          </p>

          <h2 className="text-5xl font-bold text-orange-400">
            {highCount}
          </h2>
        </div>

        <div
          className="
          bg-slate-900
          border
          border-slate-800
          rounded-2xl
          p-6
          "
        >
          <Activity
            className="text-yellow-400 mb-4"
            size={24}
          />

          <p className="text-slate-400">
            Open Findings
          </p>

          <h2 className="text-5xl font-bold text-yellow-400">
            {openCount}
          </h2>
        </div>

        <div
          className="
          bg-slate-900
          border
          border-slate-800
          rounded-2xl
          p-6
          "
        >
          <Activity
            className="text-cyan-400 mb-4"
            size={24}
          />

          <p className="text-slate-400">
            Avg Risk Score
          </p>

          <h2 className="text-5xl font-bold text-cyan-400">
            {averageRiskScore}
          </h2>
        </div>

      </div>

      {/* Executive Summary */}

      <div
        className="
        bg-slate-900
        border
        border-cyan-500/20
        rounded-2xl
        p-6
        mb-8
        "
      >
        <h2 className="text-2xl font-bold mb-4">
          Executive Summary
        </h2>

        <div className="space-y-2 text-slate-300">

          <p>
            Total Projects:
            {" "}
            {projects.length}
          </p>

          <p>
            Total Findings:
            {" "}
            {findings.length}
          </p>

          <p>
            Critical Findings:
            {" "}
            {criticalCount}
          </p>

          <p>
            High Findings:
            {" "}
            {highCount}
          </p>

        </div>
      </div>

      {/* Recent Critical Findings */}

      <div
        className="
        bg-slate-900
        border
        border-slate-800
        rounded-2xl
        p-6
        mb-8
        "
      >
        <h2 className="text-2xl font-bold mb-6">
          Recent Critical Findings
        </h2>

        <div className="space-y-3">

          {recentCriticalFindings.length === 0 && (
            <div className="text-slate-400">
              No critical findings
            </div>
          )}

          {recentCriticalFindings.map(
            (finding) => (
              <div
                key={finding.id}
                className="
                border
                border-red-500/20
                rounded-xl
                p-4
                "
              >
                <p className="font-semibold">
                  {finding.title}
                </p>

                <p className="text-sm text-slate-400">
                  {finding.project.name}
                </p>
              </div>
            )
          )}

        </div>
      </div>

      {/* AI Recommendations */}

      <div
        className="
        bg-slate-900
        border
        border-cyan-500/20
        rounded-2xl
        p-6
        "
      >
        <h2 className="text-2xl font-bold mb-6">
          AI Recommendations
        </h2>

        <ul className="space-y-3 text-slate-300">

          <li>
            Prioritize remediation of all
            critical findings.
          </li>

          <li>
            Schedule retesting for
            resolved vulnerabilities.
          </li>

          <li>
            Focus on projects with the
            highest average risk score.
          </li>

          <li>
            Implement secure SDLC reviews
            for recurring vulnerability
            classes.
          </li>

        </ul>
      </div>

    </div>
  );
}