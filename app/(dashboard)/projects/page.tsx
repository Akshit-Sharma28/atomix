import { prisma } from "@/lib/prisma";
import Link from "next/link";
import NewProjectForm from "@/components/projects/new-project-form";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      sprId: true,
      name: true,
      client: true,
      riskTier: true,
      findings: {
        select: {
          severity: true,
          status: true,
        },
      },
      reviews: {
        select: {
          srId: true,
          title: true,
          status: true,
          createdAt: true,
        },
      },
      components: {
        select: {
          id: true,
        },
      },
      scopeProfiles: {
        select: {
          id: true,
        },
      },
    },
  });

  return (
    <div className="w-full px-8 py-6">
      <div
        className="
        mb-6
        pb-5
        border-b
        border-slate-800
        "
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 text-sm text-slate-500">Projects</div>

            <h1 className="text-3xl font-bold text-white">Project Portfolio</h1>

            <p className="text-slate-400 mt-2">
              Security posture across all tracked projects.
            </p>
          </div>
        </div>
      </div>

      <NewProjectForm />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((project) => {
          const criticalCount = project.findings.filter(
            (f) => f.severity === "Critical",
          ).length;

          const openCount = project.findings.filter(
            (f) => f.status !== "Closed",
          ).length;

          const activeReviews = project.reviews.filter(
            (review) => !["Completed", "Cancelled"].includes(review.status),
          ).length;

          const latestReview = project.reviews.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          )[0];

          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="
              bg-slate-900
              border
              border-cyan-500/20
              rounded-2xl
              p-6
              hover:border-cyan-400
              hover:shadow-lg
              hover:shadow-cyan-500/10
              transition-all
              "
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-cyan-400">
                    {project.sprId ?? "SPR pending"}
                  </div>

                  <h2 className="text-xl font-bold mt-1">{project.name}</h2>
                </div>

                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  {project.riskTier ?? "Risk TBD"}
                </span>
              </div>

              <p className="text-slate-400 mb-4">{project.client}</p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-950 p-3">
                  <p className="text-slate-500">SRs</p>
                  <p className="mt-1 text-lg font-bold text-cyan-300">
                    {project.reviews.length}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950 p-3">
                  <p className="text-slate-500">Active</p>
                  <p className="mt-1 text-lg font-bold text-yellow-300">
                    {activeReviews}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950 p-3">
                  <p className="text-slate-500">Components</p>
                  <p className="mt-1 text-lg font-bold text-purple-300">
                    {project.components.length}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950 p-3">
                  <p className="text-slate-500">Scopes</p>
                  <p className="mt-1 text-lg font-bold text-emerald-300">
                    {project.scopeProfiles.length}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <p>Total Findings: {project.findings.length}</p>

                <p className="text-red-400">
                  Critical Findings: {criticalCount}
                </p>

                <p className="text-yellow-400">Open Findings: {openCount}</p>

                <p className="text-slate-500">
                  Latest SR: {latestReview?.srId ?? latestReview?.title ?? "None"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
