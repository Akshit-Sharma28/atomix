import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import {
  FolderOpen,
  AlertTriangle,
  ShieldAlert,
  Activity,
} from "lucide-react";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectPage({
  params,
}: Props) {
  const { id } = await params;

 const project = await prisma.project.findUnique({
  where: { id },
  include: {
    findings: {
      include: {
        analysis: true,
        activities: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    },
  },
});

  if (!project) {
    return (
      <div className="p-8 text-white">
        Project not found
      </div>
    );
  }

  const criticalCount =
    project.findings.filter(
      (f) => f.severity === "Critical"
    ).length;

  const highCount =
    project.findings.filter(
      (f) => f.severity === "High"
    ).length;

  const openCount =
    project.findings.filter(
      (f) => f.status !== "Closed"
    ).length;

  const riskScore = Math.round(
    project.findings.reduce(
      (sum, finding) =>
        sum +
        (finding.analysis?.riskScore || 0),
      0
    ) /
      Math.max(
        project.findings.length,
        1
      )
  );

  const overallRisk =
    criticalCount > 0
      ? "HIGH"
      : highCount > 3
      ? "MEDIUM"
      : "LOW";

  return (
    <div className="max-w-7xl mx-auto p-8">

      {/* Header */}

      <div className="mb-10">

        <div className="flex items-center gap-4">

          <FolderOpen
            size={40}
            className="text-cyan-400"
          />

          <div>
            <h1 className="text-5xl font-bold text-white">
              {project.name}
            </h1>

            <div className="flex items-center gap-3 mt-2">

              <p className="text-slate-400">
                {project.client}
              </p>

              <span
                className="
                px-3
                py-1
                rounded-full
                bg-cyan-500/20
                text-cyan-400
                text-xs
                "
              >
                {project.status}
              </span>

            </div>
          </div>

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
        <div className="flex items-center gap-3 mb-6">

          <Activity
            size={24}
            className="text-cyan-400"
          />

          <h2 className="text-2xl font-bold">
            Executive Summary
          </h2>

        </div>

        <div className="grid md:grid-cols-2 gap-4">

          <p>
            Critical Findings:
            <span className="ml-2 text-red-400 font-semibold">
              {criticalCount}
            </span>
          </p>

          <p>
            High Findings:
            <span className="ml-2 text-orange-400 font-semibold">
              {highCount}
            </span>
          </p>

          <p>
            Open Findings:
            <span className="ml-2 text-yellow-400 font-semibold">
              {openCount}
            </span>
          </p>

          <p>
            Overall Risk:
            <span
              className={
                overallRisk === "HIGH"
                  ? "ml-2 text-red-400 font-semibold"
                  : overallRisk === "MEDIUM"
                  ? "ml-2 text-yellow-400 font-semibold"
                  : "ml-2 text-green-400 font-semibold"
              }
            >
              {overallRisk}
            </span>
          </p>

        </div>
      </div>

      {/* KPI Cards */}

      <div className="grid md:grid-cols-4 gap-4 mb-8">

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">
            Total Findings
          </p>

          <h2 className="text-4xl font-bold text-cyan-400">
            {project.findings.length}
          </h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">
            Critical
          </p>

          <h2 className="text-4xl font-bold text-red-400">
            {criticalCount}
          </h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">
            Open
          </p>

          <h2 className="text-4xl font-bold text-yellow-400">
            {openCount}
          </h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">
            Risk Score
          </p>

          <h2 className="text-4xl font-bold text-cyan-400">
            {riskScore}
          </h2>
        </div>

      </div>

      {/* Findings */}

      <div
        className="
        bg-slate-900
        border
        border-slate-800
        rounded-2xl
        p-6
        "
      >
        <div className="flex items-center gap-3 mb-6">

          <ShieldAlert
            size={24}
            className="text-cyan-400"
          />

          <h2 className="text-2xl font-bold">
            Findings
          </h2>

        </div>

        <div className="space-y-3">

          {project.findings.length === 0 && (
            <div className="text-slate-400">
              No findings available
            </div>
          )}

          {project.findings.map(
            (finding) => (
              <Link
                key={finding.id}
                href={`/findings/${finding.id}`}
                className="
                block
                border
                border-slate-800
                rounded-xl
                p-4
                hover:border-cyan-400
                hover:bg-slate-800/50
                transition-all
                "
              >
                <div className="flex items-center justify-between">

                  <div>
                    <p className="font-semibold text-white">
                      {finding.title}
                    </p>

                    <p className="text-sm text-slate-400">
                      {finding.status}
                    </p>
                  </div>

                  <span
                    className={
                      finding.severity ===
                      "Critical"
                        ? "text-red-400"
                        : finding.severity ===
                          "High"
                        ? "text-orange-400"
                        : finding.severity ===
                          "Medium"
                        ? "text-yellow-400"
                        : "text-green-400"
                    }
                  >
                    {finding.severity}
                  </span>

                </div>
              </Link>
            )
          )}

        </div>
      </div>

    </div>
  );
}