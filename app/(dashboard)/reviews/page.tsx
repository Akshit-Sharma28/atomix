import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NewProjectForm from "@/components/projects/new-project-form";
import { canAccess } from "@/services/users/access.service";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FileSearch,
  ShieldCheck,
  Users,
} from "lucide-react";

function badgeClass(status: string) {
  if (["Completed", "Closed"].includes(status)) {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  }

  if (["Cancelled", "Blocked"].includes(status)) {
    return "bg-red-500/15 text-red-300 border-red-500/30";
  }

  if (["In Progress", "Assigned"].includes(status)) {
    return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
  }

  return "bg-slate-500/15 text-slate-300 border-slate-500/30";
}

export default async function ReviewsPage() {
  const [
    reviews,
    unassignedReviews,
    activeAssignments,
    extensionRequests,
    canCreateInformationSystem,
    projectManagers,
  ] =
    await Promise.all([
      prisma.securityReview.findMany({
        include: {
          project: true,
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
      }),
      prisma.securityReview.count({
        where: {
          assignments: {
            none: {},
          },
          status: {
            notIn: ["Completed", "Cancelled"],
          },
        },
      }),
      prisma.reviewerAssignment.count({
        where: {
          status: {
            in: ["Assigned", "Accepted", "In Progress"],
          },
        },
      }),
      prisma.reviewExtension.count({
        where: {
          status: "Requested",
        },
      }),
      canAccess(["ADMIN"]),
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

  const activeReviews = reviews.filter(
    (review) => !["Completed", "Cancelled"].includes(review.status),
  ).length;

  const cancelledReviews = reviews.filter(
    (review) => review.status === "Cancelled" || review.cancellation,
  ).length;

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-6 pb-5 border-b border-slate-800">
        <div className="mb-2 text-sm text-slate-500">
          Governance Portfolio / SR Tracker
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              SR Tracker
            </h1>

            <p className="text-slate-400 mt-2 max-w-3xl">
              Drill into dated security review records, workstreams,
              assignments, extension requests, cancellations, retest signals,
              and governance readiness across the Portfolio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/projects"
              className="rounded-xl border border-cyan-400/30 px-4 py-2.5 font-semibold text-cyan-200 hover:border-cyan-300"
            >
              Back to Portfolio
            </Link>
            <Link
              href="/my-findings"
              className="rounded-xl border border-slate-700 px-4 py-2.5 font-semibold text-slate-200 hover:bg-slate-800"
            >
              My Reviews
            </Link>
            {canCreateInformationSystem && (
              <Link
                href="#create-information-system"
                className="rounded-xl bg-cyan-500 px-4 py-2.5 font-semibold text-black hover:bg-cyan-400"
              >
                Create Information System / SPR
              </Link>
            )}
          </div>
        </div>
      </div>

      {canCreateInformationSystem && (
        <div id="create-information-system">
          <NewProjectForm projectManagers={projectManagers} />
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Active SRs</span>
            <FileSearch size={20} className="text-cyan-400" />
          </div>
          <div className="mt-3 text-4xl font-bold text-cyan-300">
            {activeReviews}
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-500/20 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Unassigned</span>
            <AlertTriangle size={20} className="text-yellow-400" />
          </div>
          <div className="mt-3 text-4xl font-bold text-yellow-300">
            {unassignedReviews}
          </div>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Assignments</span>
            <Users size={20} className="text-purple-400" />
          </div>
          <div className="mt-3 text-4xl font-bold text-purple-300">
            {activeAssignments}
          </div>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Extensions</span>
            <CalendarClock size={20} className="text-red-400" />
          </div>
          <div className="mt-3 text-4xl font-bold text-red-300">
            {extensionRequests}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-white">Review Tracker</h2>
            <p className="text-sm text-slate-400">
              Each row is an SR under a long-lived SPR/project.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <ShieldCheck size={18} className="text-emerald-400" />
            {cancelledReviews} cancelled / closed out
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr className="border-b border-slate-800">
                <th className="px-6 py-3 font-medium">SR</th>
                <th className="px-6 py-3 font-medium">SPR / Project</th>
                <th className="px-6 py-3 font-medium">Workstreams</th>
                <th className="px-6 py-3 font-medium">Reviewers</th>
                <th className="px-6 py-3 font-medium">Findings</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Due</th>
              </tr>
            </thead>

            <tbody>
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    No SRs yet. Create reviews from a project once migrations are applied.
                  </td>
                </tr>
              )}

              {reviews.map((review) => {
                const reviewers = review.assignments
                  .map(
                    (assignment) =>
                      assignment.user?.name ??
                      assignment.reviewerProfile?.user.name ??
                      "Unassigned",
                  )
                  .join(", ");

                return (
                  <tr
                    key={review.id}
                    className="border-b border-slate-800/70 hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/reviews/${review.id}`}
                        className="font-semibold text-white hover:text-cyan-200"
                      >
                        {review.srId ?? review.title}
                      </Link>
                      <div className="text-slate-500">{review.type}</div>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/projects/${review.projectId}`}
                        className="text-cyan-300 hover:text-cyan-200"
                      >
                        {review.project.sprId ?? review.project.name}
                      </Link>
                      <div className="text-slate-500">{review.project.name}</div>
                    </td>

                    <td className="px-6 py-4 text-slate-300">
                      {review.workstreams.length > 0
                        ? review.workstreams.map((item) => item.type).join(", ")
                        : "Not scoped"}
                    </td>

                    <td className="px-6 py-4 text-slate-300">
                      {reviewers || (
                        <span className="text-yellow-300">Needs assignment</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-300">
                      {review.findings.length}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${badgeClass(
                          review.status,
                        )}`}
                      >
                        {review.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-400">
                      {review.dueDate
                        ? review.dueDate.toLocaleDateString()
                        : "Not set"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={22} className="mt-0.5 text-cyan-300" />
          <div>
            <h3 className="font-semibold text-white">V1 operating model</h3>
            <p className="mt-1 text-sm text-slate-400">
              Use Information System as the long-lived package, SR as the dated
              review record, ReviewWorkstream for frontend/backend/API/MSB/LLM
              streams, and evidence records for control observations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
