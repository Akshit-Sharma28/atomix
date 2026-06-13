import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Activity,
  AlertTriangle,
  Download,
  FileText,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

function riskWeight(severity: string) {
  if (severity === "Critical") return 10;
  if (severity === "High") return 7;
  if (severity === "Medium") return 4;
  if (severity === "Low") return 1;
  return 0;
}

export default async function ReportsPage() {
  const [findings, projects, reviews] =
    await Promise.all([
      prisma.finding.findMany({
        include: {
          project: true,
          analysis: true,
          review: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.project.findMany({
        include: {
          findings: true,
          reviews: true,
          components: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.securityReview.findMany({
        include: {
          project: true,
          assignments: true,
          extensions: true,
          cancellation: true,
        },
      }),
    ]);

  const criticalCount =
    findings.filter(
      (finding) =>
        finding.severity === "Critical"
    ).length;

  const highCount =
    findings.filter(
      (finding) =>
        finding.severity === "High"
    ).length;

  const openCount =
    findings.filter(
      (finding) =>
        finding.status !== "Closed"
    ).length;

  const activeReviews =
    reviews.filter(
      (review) =>
        !["Completed", "Cancelled"].includes(
          review.status
        )
    );

  const unassignedReviews =
    activeReviews.filter(
      (review) =>
        review.assignments.length === 0
    );

  const extensionRequests =
    reviews.flatMap((review) =>
      review.extensions.filter(
        (extension) =>
          extension.status === "Requested"
      )
    ).length;

  const averageRiskScore =
    findings.length > 0
      ? Math.round(
          findings.reduce(
            (sum, finding) =>
              sum +
              (finding.analysis?.riskScore ??
                riskWeight(finding.severity)),
            0
          ) / findings.length
        )
      : 0;

  const topRiskProjects =
    projects
      .map((project) => {
        const score =
          project.findings.reduce(
            (sum, finding) =>
              sum + riskWeight(finding.severity),
            0
          );

        return {
          id: project.id,
          name: project.name,
          sprId: project.sprId,
          score,
          openFindings:
            project.findings.filter(
              (finding) =>
                finding.status !== "Closed"
            ).length,
          activeReviews:
            project.reviews.filter(
              (review) =>
                ![
                  "Completed",
                  "Cancelled",
                ].includes(review.status)
            ).length,
          components:
            project.components.length,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

  const recentCriticalFindings =
    findings
      .filter(
        (finding) =>
          finding.severity === "Critical"
      )
      .slice(0, 5);

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <FileText
            size={40}
            className="text-cyan-400"
          />

          <div>
            <div className="mb-2 text-sm text-slate-500">
              Reports
            </div>

            <h1 className="text-4xl font-bold text-white">
              Executive Reports
            </h1>

            <p className="mt-2 text-slate-400">
              Security posture, SR delivery, and vulnerability trends.
            </p>
          </div>
        </div>

        <button className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition-all hover:bg-cyan-400">
          <Download size={18} />
          Export PDF
        </button>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-red-500/20 bg-slate-900 p-6">
          <ShieldAlert className="mb-4 text-red-400" size={24} />
          <p className="text-slate-400">Critical Findings</p>
          <h2 className="text-4xl font-bold text-red-400">{criticalCount}</h2>
        </div>

        <div className="rounded-2xl border border-orange-500/20 bg-slate-900 p-6">
          <AlertTriangle className="mb-4 text-orange-400" size={24} />
          <p className="text-slate-400">High Findings</p>
          <h2 className="text-4xl font-bold text-orange-400">{highCount}</h2>
        </div>

        <div className="rounded-2xl border border-yellow-500/20 bg-slate-900 p-6">
          <Activity className="mb-4 text-yellow-400" size={24} />
          <p className="text-slate-400">Open Findings</p>
          <h2 className="text-4xl font-bold text-yellow-400">{openCount}</h2>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-6">
          <TrendingUp className="mb-4 text-cyan-400" size={24} />
          <p className="text-slate-400">Avg Risk Score</p>
          <h2 className="text-4xl font-bold text-cyan-400">{averageRiskScore}</h2>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Projects / SPRs</p>
          <p className="mt-2 text-3xl font-bold text-white">{projects.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Total SRs</p>
          <p className="mt-2 text-3xl font-bold text-cyan-300">{reviews.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Unassigned SRs</p>
          <p className="mt-2 text-3xl font-bold text-yellow-300">{unassignedReviews.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Extension Requests</p>
          <p className="mt-2 text-3xl font-bold text-pink-300">{extensionRequests}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Top Risk SPRs</h2>
            <p className="text-sm text-slate-400">
              Ranked by severity-weighted finding load.
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {topRiskProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-800/40"
              >
                <div>
                  <p className="font-semibold text-white">{project.name}</p>
                  <p className="text-sm text-slate-500">
                    {project.sprId ?? "SPR pending"} · {project.components} components
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-cyan-300">{project.score}</p>
                  <p className="text-xs text-slate-500">
                    {project.openFindings} open · {project.activeReviews} active SRs
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="text-xl font-bold text-white">
              Recent Critical Findings
            </h2>
            <p className="text-sm text-slate-400">
              Highest priority issues requiring leadership visibility.
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {recentCriticalFindings.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No critical findings.
              </div>
            )}

            {recentCriticalFindings.map((finding) => (
              <Link
                key={finding.id}
                href={`/findings/${finding.id}`}
                className="block px-6 py-4 hover:bg-slate-800/40"
              >
                <p className="font-semibold text-white">{finding.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {finding.project.sprId ?? finding.project.name}
                  {" · "}
                  {finding.review?.srId ?? "No SR"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
        <h2 className="text-xl font-bold text-white">
          Recommended Actions
        </h2>
        <ul className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
          <li>Prioritize remediation of all critical and overdue findings.</li>
          <li>Assign reviewers to unstaffed SRs before new intake grows.</li>
          <li>Review extension requests for active SRs nearing due dates.</li>
          <li>Use scope profiles to normalize frontend, backend, API, MSB, and LLM reviews.</li>
        </ul>
      </section>
    </div>
  );
}
