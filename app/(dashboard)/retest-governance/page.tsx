import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileSearch,
  RotateCcw,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { canAccess } from "@/services/users/access.service";
import { getRetestGovernanceDashboard } from "@/services/dashboard/retest-governance.service";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function statusClass(status: string) {
  if (status === "Completed") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }

  if (["Overdue", "Cancelled"].includes(status)) {
    return "border-red-500/30 bg-red-500/10 text-red-200";
  }

  if (status === "Extension Needed") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }

  if (status === "In Progress") {
    return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
  }

  return "border-slate-700 bg-slate-900 text-slate-300";
}

export default async function RetestGovernancePage() {
  const allowed = await canAccess([
    "ADMIN",
    "GOVERNANCE_TEAM",
    "EXECUTIVE",
  ]);

  if (!allowed) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
          <h1 className="text-2xl font-bold text-white">
            Retest Governance access restricted
          </h1>
          <p className="mt-2 text-slate-400">
            This view is available to Admin, Governance Team, and Executive
            roles only.
          </p>
        </div>
      </div>
    );
  }

  const data = await getRetestGovernanceDashboard();

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-6 border-b border-slate-800 pb-5">
        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
          <RotateCcw size={16} />
          Retest Governance
        </div>
        <h1 className="text-3xl font-bold text-white">
          Retest Request Command Center
        </h1>
        <p className="mt-2 max-w-4xl text-slate-400">
          Track retest requests from project-team readiness through reviewer
          assignment, control coverage, retest status, extension pressure, and
          prior retest iteration history.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          ["Requests", data.summary.total, "active retest queue"],
          [
            "Controls",
            data.summary.controlsInRetest,
            "in retest requests",
          ],
          ["Not Assigned", data.summary.notAssigned, "need reviewer"],
          ["In Progress", data.summary.inProgress, "being retested"],
          ["Overdue", data.summary.overdue, "past target"],
          [
            "Extensions",
            data.summary.extensionNeeded,
            "need decision",
          ],
        ].map(([label, value, helper]) => (
          <div
            key={label as string}
            className="rounded-2xl border border-cyan-500/10 bg-slate-900/70 p-4"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              {label as string}
            </p>
            <p className="mt-3 text-3xl font-black text-white">
              {value as number}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {helper as string}
            </p>
          </div>
        ))}
      </div>

      <section className="mb-6 rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.04] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-200">
              <Bot size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                Retest Governance Agent
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Assign ready fixes to available reviewers
              </h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
                The agent reviews project-team readiness, access availability,
                number of controls, review type, prior retest history, and
                reviewer capacity to recommend assignment and escalation
                actions.
              </p>
            </div>
          </div>
          <Link
            href={`/copilot?prompt=${encodeURIComponent(
              "Act as the Retest Governance Agent. Analyze retest requests, access readiness, fixes readiness, overdue items, extension needs, available reviewers, initial reviewers, and prior retest iterations. Recommend assignments, escalations, and executive insights.",
            )}`}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950"
          >
            <Bot size={16} />
            Ask Retest Agent
          </Link>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {data.insights.map((insight) => (
            <div
              key={insight}
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-6 text-slate-300"
            >
              {insight}
            </div>
          ))}
        </div>
      </section>

      <div className="mb-6 grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 xl:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <FileSearch className="text-cyan-300" size={22} />
            <div>
              <h2 className="text-xl font-bold text-white">
                Retest Requests
              </h2>
              <p className="text-sm text-slate-400">
                SPR, SR, charge code, scope, controls, readiness, assignment,
                status, and retest history.
              </p>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full min-w-[1150px] text-sm">
              <thead className="bg-slate-950/70 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="p-4">Project</th>
                  <th className="p-4">Review</th>
                  <th className="p-4">Scope</th>
                  <th className="p-4">Readiness</th>
                  <th className="p-4">Reviewer</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">History</th>
                </tr>
              </thead>
              <tbody>
                {data.requests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-t border-slate-800 align-top"
                  >
                    <td className="p-4">
                      <Link
                        href={`/projects/${request.projectId}`}
                        className="font-semibold text-white hover:text-cyan-200"
                      >
                        {request.project}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        {request.sprId} · {request.srId}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Charge: {request.chargeCode}
                      </p>
                    </td>
                    <td className="p-4 text-slate-300">
                      <p className="font-semibold text-cyan-200">
                        {request.type}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Requested {formatDate(request.requestedAt)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Target {formatDate(request.dueDate)}
                      </p>
                    </td>
                    <td className="p-4 text-slate-300">
                      <p className="max-w-sm leading-6">
                        {request.scope}
                      </p>
                      <p className="mt-2 text-xs text-cyan-200">
                        {request.controlsCount} controls
                      </p>
                      <p className="mt-1 max-w-sm text-xs text-slate-500">
                        {request.controlsSummary}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2 text-xs">
                        <span className="flex items-center gap-2 text-slate-300">
                          {request.fixesReady ? (
                            <CheckCircle2
                              size={14}
                              className="text-emerald-300"
                            />
                          ) : (
                            <Clock3
                              size={14}
                              className="text-amber-300"
                            />
                          )}
                          Fixes ready
                        </span>
                        <span className="flex items-center gap-2 text-slate-300">
                          {request.accessReady ? (
                            <CheckCircle2
                              size={14}
                              className="text-emerald-300"
                            />
                          ) : (
                            <AlertTriangle
                              size={14}
                              className="text-amber-300"
                            />
                          )}
                          Access ready
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">
                      <p>{request.assignedReviewer}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Initial: {request.initialReviewer}
                      </p>
                      <p className="mt-2 max-w-xs text-xs text-cyan-200">
                        {request.recommendation}
                      </p>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                          request.status,
                        )}`}
                      >
                        {request.status}
                      </span>
                      {request.extensionNeeded && (
                        <p className="mt-2 flex items-center gap-1 text-xs text-amber-300">
                          <CalendarClock size={13} />
                          extension decision
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-slate-300">
                      <p>{request.priorIterations} prior iterations</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {request.priorRetesters.length > 0
                          ? request.priorRetesters.join(", ")
                          : "No prior retest"}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="mb-4 flex items-center gap-3">
            <UserCheck className="text-cyan-300" size={22} />
            <div>
              <h2 className="text-xl font-bold text-white">
                Available Reviewers
              </h2>
              <p className="text-sm text-slate-400">
                Used for retest assignment recommendations.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {data.reviewerQueue.slice(0, 8).map((reviewer) => (
              <div
                key={reviewer.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">
                      {reviewer.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {reviewer.capacity}h capacity ·{" "}
                      {reviewer.activeAssignments} active assignments
                    </p>
                  </div>
                  <ShieldCheck
                    className="text-emerald-300"
                    size={18}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {reviewer.skills.length > 0 ? (
                    reviewer.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-cyan-400/10 px-2 py-1 text-[11px] text-cyan-200"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">
                      Skill profile pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
