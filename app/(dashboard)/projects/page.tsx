import { prisma } from "@/lib/prisma";
import Link from "next/link";
import NewProjectForm from "@/components/projects/new-project-form";
import { canAccess, getActiveRole } from "@/services/users/access.service";
import { getCurrentUser } from "@/services/users/current-user.service";
import { FileSearch, ShieldAlert, UserCheck } from "lucide-react";

export default async function ProjectsPage() {
  const [canCreateInformationSystem, activeRole, currentUser, projectManagers] =
    await Promise.all([
      canAccess(["ADMIN"]),
      getActiveRole(),
      getCurrentUser(),
      prisma.user.findMany({
        where: {
          role: {
            in: ["PROJECT_MANAGER", "ENGAGEMENT_MANAGER"],
          },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

  const projects = await prisma.project.findMany({
    where:
      activeRole === "PROJECT_MANAGER" && currentUser
        ? {
            projectManagerId: currentUser.id,
          }
        : undefined,
    select: {
      id: true,
      sprId: true,
      name: true,
      client: true,
      riskTier: true,
      businessOwner: true,
      technicalOwner: true,
      projectManager: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
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
    orderBy: {
      updatedAt: "desc",
    },
  });

  const totalSrs = projects.reduce(
    (sum, project) => sum + project.reviews.length,
    0,
  );
  const openFindings = projects.reduce(
    (sum, project) =>
      sum + project.findings.filter((finding) => finding.status !== "Closed").length,
    0,
  );
  const activeReviews = projects.reduce(
    (sum, project) =>
      sum +
      project.reviews.filter(
        (review) => !["Completed", "Cancelled"].includes(review.status),
      ).length,
    0,
  );

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
            <div className="mb-2 text-sm text-slate-500">
              Portfolio
            </div>

            <h1 className="text-3xl font-bold text-white">
              SPR / Information System Portfolio
            </h1>

            <p className="mt-2 max-w-3xl text-slate-400">
              One place for long-lived Information Systems / SPRs. Open a card
              to see SRs, findings, components, scope, and review history.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/reviews"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 px-4 py-2.5 font-semibold text-cyan-200 hover:border-cyan-300"
            >
              <FileSearch size={16} />
              SR Tracker
            </Link>
            <Link
              href="/findings"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 px-4 py-2.5 font-semibold text-cyan-200 hover:border-cyan-300"
            >
              <ShieldAlert size={16} />
              Findings Governance
            </Link>
            <Link
              href="/my-findings"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 font-semibold text-black hover:bg-cyan-400"
            >
              <UserCheck size={16} />
              My Reviews
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          ["Information Systems", projects.length, "tracked SPR records"],
          ["Total SRs", totalSrs, "security review records"],
          ["Active SRs", activeReviews, "in delivery or assignment"],
          ["Open Findings", openFindings, "need closure or retest"],
        ].map(([label, value, helper]) => (
          <div
            key={label as string}
            className="rounded-2xl border border-cyan-500/10 bg-slate-900/70 p-5"
          >
            <p className="text-sm text-slate-400">{label as string}</p>
            <p className="mt-3 text-3xl font-black text-cyan-300">
              {value as number}
            </p>
            <p className="mt-1 text-xs text-slate-500">{helper as string}</p>
          </div>
        ))}
      </div>

      {canCreateInformationSystem && (
        <NewProjectForm projectManagers={projectManagers} />
      )}

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

              <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm">
                <p className="text-slate-500">Project Manager</p>
                <p className="mt-1 font-semibold text-cyan-200">
                  {project.projectManager?.name ?? "Not assigned"}
                </p>
              </div>

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
