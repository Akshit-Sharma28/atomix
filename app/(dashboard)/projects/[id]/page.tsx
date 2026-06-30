import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Activity,
  Boxes,
  CalendarClock,
  FileSearch,
  FolderOpen,
  Plus,
  ShieldAlert,
  Target,
} from "lucide-react";

import { createProjectSecurityReview } from "./actions";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      findings: {
        include: {
          analysis: true,
          review: true,
          component: true,
          activities: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
      components: true,
      projectManager: true,
      scopeProfiles: {
        include: {
          requiredReviews: true,
          scopeItems: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      reviews: {
        include: {
          workstreams: true,
          assignments: {
            include: {
              user: true,
              reviewerProfile: {
                include: {
                  user: true,
                },
              },
            },
          },
          findings: true,
          extensions: true,
          cancellation: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!project) {
    return <div className="p-8 text-white">Project not found</div>;
  }

  const criticalCount = project.findings.filter(
    (f) => f.severity === "Critical",
  ).length;

  const highCount = project.findings.filter(
    (f) => f.severity === "High",
  ).length;

  const openCount = project.findings.filter(
    (f) => f.status !== "Closed",
  ).length;

  const aiReviewed = project.findings.filter((f) => f.analysis).length;
  const activeReviews = project.reviews.filter(
    (review) => !["Completed", "Cancelled"].includes(review.status),
  ).length;
  const unassignedReviews = project.reviews.filter(
    (review) =>
      review.assignments.length === 0 &&
      !["Completed", "Cancelled"].includes(review.status),
  ).length;
  const extensionRequests = project.reviews.reduce(
    (count, review) =>
      count +
      review.extensions.filter((extension) => extension.status === "Requested")
        .length,
    0,
  );

  const riskScore = Math.round(
    project.findings.reduce(
      (sum, finding) => sum + (finding.analysis?.riskScore || 0),
      0,
    ) / Math.max(project.findings.length, 1),
  );

  const overallRisk =
    criticalCount > 0 ? "HIGH" : highCount > 3 ? "MEDIUM" : "LOW";

  return (
    <div className="mx-auto max-w-7xl p-8">
      {/* Header */}

     <div className="mb-10">
  <div className="flex flex-wrap items-start justify-between gap-5 xl:pr-56">

    <div className="flex items-center gap-4">
      <FolderOpen
        size={40}
        className="text-cyan-400"
      />

      <div>
        <div className="mb-2 text-sm text-slate-500">
          SPR / {project.sprId ?? project.id}
        </div>

        <h1 className="text-3xl font-bold text-white">
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

          <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs">
            {project.riskTier ?? "Risk profile TBD"}
          </span>
        </div>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <a
        href="#create-sr"
        className="
        inline-flex
        items-center
        gap-2
        rounded-xl
        border
        border-cyan-400/40
        px-4
        py-2.5
        font-semibold
        text-cyan-100
        transition-all
        hover:border-cyan-300
        hover:bg-cyan-400/10
        "
      >
        <Plus size={17} />
        Create SR
      </a>

      <Link
        href={`/findings/new?project=${project.id}`}
        className="
        inline-flex
        items-center
        gap-2
        rounded-xl
        bg-cyan-500
        px-4
        py-2.5
        font-semibold
        text-black
        transition-all
        hover:bg-cyan-400
        "
      >
        <ShieldAlert size={17} />
        New Finding
      </Link>
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
          <Activity size={24} className="text-cyan-400" />

          <h2 className="text-2xl font-bold">Executive Summary</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <p>
            SPR:
            <span className="ml-2 text-cyan-400 font-semibold">
              {project.sprId ?? "Not assigned"}
            </span>
          </p>

          <p>
            Project Manager:
            <span className="ml-2 text-cyan-400 font-semibold">
              {project.projectManager?.name ?? "Not assigned"}
            </span>
          </p>

          <p>
            Business Owner:
            <span className="ml-2 text-cyan-400 font-semibold">
              {project.businessOwner ?? "Not assigned"}
            </span>
          </p>

          <p>
            Technical Owner:
            <span className="ml-2 text-cyan-400 font-semibold">
              {project.technicalOwner ?? "Not assigned"}
            </span>
          </p>

          <p>
            Active SRs:
            <span className="ml-2 text-cyan-400 font-semibold">
              {activeReviews}
            </span>
          </p>

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

      <div className="grid md:grid-cols-5 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Total Findings</p>

          <h2 className="text-4xl font-bold text-cyan-400">
            {project.findings.length}
          </h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Critical</p>

          <h2 className="text-4xl font-bold text-red-400">{criticalCount}</h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Open</p>

          <h2 className="text-4xl font-bold text-yellow-400">{openCount}</h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Risk Score</p>

          <h2 className="text-4xl font-bold text-cyan-400">{riskScore}</h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">AI Reviewed</p>

          <h2 className="text-4xl font-bold text-purple-400">{aiReviewed}</h2>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <FileSearch size={22} className="text-cyan-400" />
            <h2 className="text-xl font-bold">Security Records</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-xs text-slate-500">Total SRs</p>
              <p className="mt-1 text-2xl font-bold text-cyan-300">
                {project.reviews.length}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-xs text-slate-500">Unassigned</p>
              <p className="mt-1 text-2xl font-bold text-yellow-300">
                {unassignedReviews}
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-xs text-slate-500">Extensions</p>
              <p className="mt-1 text-2xl font-bold text-red-300">
                {extensionRequests}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Boxes size={22} className="text-purple-400" />
            <h2 className="text-xl font-bold">Components</h2>
          </div>

          <div className="space-y-3">
            {project.components.length === 0 && (
              <p className="text-sm text-slate-500">No components mapped yet.</p>
            )}

            {project.components.slice(0, 4).map((component) => (
              <div
                key={component.id}
                className="flex items-center justify-between rounded-xl bg-slate-950 p-3"
              >
                <div>
                  <p className="font-medium text-white">{component.name}</p>
                  <p className="text-xs text-slate-500">{component.type}</p>
                </div>
                <span className="text-xs text-slate-400">
                  {component.criticality}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Target size={22} className="text-emerald-400" />
            <h2 className="text-xl font-bold">Scope Profile</h2>
          </div>

          {project.scopeProfiles[0] ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Profile</p>
                <p className="font-medium text-white">
                  {project.scopeProfiles[0].name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-950 p-3">
                  <p className="text-xs text-slate-500">Risk</p>
                  <p className="text-slate-300">
                    {project.scopeProfiles[0].riskProfile ?? "TBD"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-950 p-3">
                  <p className="text-xs text-slate-500">Reviews</p>
                  <p className="text-slate-300">
                    {project.scopeProfiles[0].requiredReviews.length}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {project.scopeProfiles[0].requiredReviews.map((reviewType) => (
                  <span
                    key={reviewType.id}
                    className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300"
                  >
                    {reviewType.type}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No scoping profile yet. V1 should capture risk, assets, scans,
              and required frontend/backend/API/MSB/LLM reviews here.
            </p>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <CalendarClock size={24} className="text-cyan-400" />
            <div>
              <h2 className="text-2xl font-bold">SR Governance History</h2>
              <p className="mt-1 text-sm text-slate-500">
                Create Security Review records directly under this SPR, then assign
                them through governance.
              </p>
            </div>
          </div>
          <a
            href="#create-sr"
            className="rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-bold text-cyan-200 hover:bg-cyan-400/10"
          >
            Add SR to SPR
          </a>
        </div>

        <form
          id="create-sr"
          action={createProjectSecurityReview}
          className="mb-6 scroll-mt-28 rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-5"
        >
          <input type="hidden" name="projectId" value={project.id} />

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
                Create SR inside {project.sprId ?? "this SPR"}
              </p>
              <h3 className="mt-2 text-xl font-bold text-white">
                New Security Review
              </h3>
            </div>
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
              Auto-generates next SR ID
            </span>
          </div>

          <div className="grid gap-3 lg:grid-cols-5">
            <label className="lg:col-span-2">
              <span className="mb-2 block text-sm text-slate-400">SR title</span>
              <input
                name="title"
                required
                defaultValue={`${project.name} Security Review`}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                placeholder="MCP Review API Security Review"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm text-slate-400">Review type</span>
              <select
                name="type"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              >
                <option>PENTEST</option>
                <option>WEB</option>
                <option>API</option>
                <option>LLM</option>
                <option>MOBILE</option>
                <option>RETEST</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm text-slate-400">Priority</span>
              <select
                name="priority"
                defaultValue={project.riskTier ?? "Medium"}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              >
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm text-slate-400">Workstream</span>
              <select
                name="workstream"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              >
                <option>WEB</option>
                <option>API</option>
                <option>LLM</option>
                <option>MOBILE</option>
                <option>BEAD</option>
                <option>FEAD</option>
              </select>
            </label>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <label>
              <span className="mb-2 block text-sm text-slate-400">
                Requested start
              </span>
              <input
                name="requestedStartDate"
                type="date"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm text-slate-400">Due date</span>
              <input
                name="dueDate"
                type="date"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              />
            </label>

            <button className="mt-7 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300">
              Create SR
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {project.reviews.length === 0 && (
            <div className="text-slate-400">
              No SRs have been created for this SPR yet.
            </div>
          )}

          {project.reviews.map((review) => {
            const reviewers = review.assignments
              .map(
                (assignment) =>
                  assignment.user?.name ??
                  assignment.reviewerProfile?.user.name ??
                  "Unassigned",
              )
              .join(", ");

            return (
              <Link
                key={review.id}
                href={`/reviews/${review.id}`}
                className="block w-full rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-cyan-400/40 hover:bg-slate-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">
                      {review.srId ?? review.title}
                    </p>
                    <p className="text-sm text-slate-500">
                      {review.type} • {review.status}
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-400/30 px-3 py-1 text-xs font-semibold text-cyan-200">
                    Open SR
                  </span>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {review.workstreams.map((workstream) => (
                      <span
                        key={workstream.id}
                        className="rounded-full bg-cyan-500/10 px-3 py-1 text-cyan-300"
                      >
                        {workstream.type}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid md:grid-cols-4 gap-3 text-sm">
                  <div className="rounded-lg bg-slate-900 p-3">
                    <p className="text-slate-500">Reviewers</p>
                    <p className="mt-1 text-slate-300">
                      {reviewers || "Needs assignment"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-900 p-3">
                    <p className="text-slate-500">Findings</p>
                    <p className="mt-1 text-slate-300">
                      {review.findings.length}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-900 p-3">
                    <p className="text-slate-500">Due Date</p>
                    <p className="mt-1 text-slate-300">
                      {review.dueDate
                        ? review.dueDate.toLocaleDateString()
                        : "Not set"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-900 p-3">
                    <p className="text-slate-500">Exception</p>
                    <p className="mt-1 text-slate-300">
                      {review.cancellation
                        ? "Cancellation requested"
                        : review.extensions.length > 0
                          ? "Extension requested"
                          : "None"}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
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
          <ShieldAlert size={24} className="text-cyan-400" />

          <h2 className="text-2xl font-bold">Findings</h2>
        </div>

        <div className="space-y-3">
          {project.findings.length === 0 && (
            <div className="text-slate-400">No findings available</div>
          )}

          {project.findings.map((finding) => (
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
                  <p className="font-semibold text-white">{finding.title}</p>

                  <p className="text-sm text-slate-400">{finding.status}</p>
                </div>

                <span
                  className={
                    finding.severity === "Critical"
                      ? "text-red-400"
                      : finding.severity === "High"
                        ? "text-orange-400"
                        : finding.severity === "Medium"
                          ? "text-yellow-400"
                          : "text-green-400"
                  }
                >
                  {finding.severity}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
