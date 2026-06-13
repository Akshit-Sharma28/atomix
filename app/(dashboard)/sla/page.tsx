import Link from "next/link";
import SLAKPIs from "@/components/sla/sla-kpis";
import {
  getSLAMetrics,
} from "@/services/sla/sla-dashboard.service";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FileSearch,
  ShieldAlert,
  TimerReset,
} from "lucide-react";

function severityClass(severity: string) {
  if (severity === "Critical") {
    return "text-red-300";
  }

  if (severity === "High") {
    return "text-orange-300";
  }

  if (severity === "Medium") {
    return "text-yellow-300";
  }

  return "text-emerald-300";
}

function reviewDueClass(
  daysUntilDue: number | null
) {
  if (daysUntilDue === null) {
    return "text-slate-500";
  }

  if (daysUntilDue < 0) {
    return "text-red-300";
  }

  if (daysUntilDue <= 7) {
    return "text-yellow-300";
  }

  return "text-emerald-300";
}

function formatDate(
  date?: Date | null
) {
  if (!date) return "Not set";

  return date.toLocaleDateString();
}

export default async function SLAPage() {
  const metrics =
    await getSLAMetrics();

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-8 border-b border-slate-800 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <AlertTriangle
              size={40}
              className="text-orange-400"
            />

            <div>
              <div className="mb-2 text-sm text-slate-500">
                SLA / Governance
              </div>

              <h1 className="text-4xl font-bold text-white">
                SLA Command Center
              </h1>

              <p className="mt-2 max-w-3xl text-slate-400">
                Track finding remediation SLAs and SR delivery health across
                pentests, reviewer assignments, extensions, cancellations, and
                risk exceptions.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/reviews"
              className="rounded-xl border border-cyan-500/30 px-4 py-2.5 text-cyan-300 hover:bg-cyan-500/10"
            >
              Review SRs
            </Link>

            <Link
              href="/reviewers"
              className="rounded-xl bg-cyan-500 px-4 py-2.5 font-semibold text-black hover:bg-cyan-400"
            >
              Pentester Tracker
            </Link>
          </div>
        </div>
      </div>

      <SLAKPIs metrics={metrics} />

      <div className="mt-8 grid lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Remediation Plans Due</span>
            <CheckCircle2 size={20} className="text-emerald-300" />
          </div>
          <div className="mt-3 text-3xl font-bold text-emerald-300">
            {metrics.remediationDueSoon}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Target dates within 14 days
          </p>
        </div>

        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Exceptions Expiring</span>
            <TimerReset size={20} className="text-yellow-300" />
          </div>
          <div className="mt-3 text-3xl font-bold text-yellow-300">
            {metrics.exceptionExpiringSoon}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Risk exceptions within 30 days
          </p>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Cancellation Requests</span>
            <ShieldAlert size={20} className="text-red-300" />
          </div>
          <div className="mt-3 text-3xl font-bold text-red-300">
            {metrics.cancellationRequests}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            SRs waiting for close-out decision
          </p>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>SRs Due 7d</span>
            <CalendarClock size={20} className="text-purple-300" />
          </div>
          <div className="mt-3 text-3xl font-bold text-purple-300">
            {metrics.reviewsDueSoon}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Active security reviews nearing due date
          </p>
        </div>
      </div>

      <div className="mt-8 grid xl:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-4">
            <ShieldAlert size={22} className="text-red-300" />
            <div>
              <h2 className="text-xl font-bold text-white">
                Overdue Finding SLAs
              </h2>
              <p className="text-sm text-slate-400">
                Remediation items past due and still active.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr className="border-b border-slate-800">
                  <th className="px-6 py-3 font-medium">Finding</th>
                  <th className="px-6 py-3 font-medium">SPR / SR</th>
                  <th className="px-6 py-3 font-medium">Owner</th>
                  <th className="px-6 py-3 font-medium">Age</th>
                </tr>
              </thead>

              <tbody>
                {metrics.overdueFindings.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-10 text-center text-slate-500"
                    >
                      No overdue findings. Rare creature. Protect it.
                    </td>
                  </tr>
                )}

                {metrics.overdueFindings.map(
                  (finding) => (
                    <tr
                      key={finding.id}
                      className="border-b border-slate-800/70 hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/findings/${finding.id}`}
                          className="font-semibold text-white hover:text-cyan-300"
                        >
                          {finding.title}
                        </Link>
                        <div
                          className={`mt-1 text-xs ${severityClass(
                            finding.severity
                          )}`}
                        >
                          {finding.severity} • {finding.status}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        <div>{finding.sprId ?? finding.projectName}</div>
                        <div className="text-xs text-slate-500">
                          {finding.srId ?? "No SR"}{" "}
                          {finding.componentName
                            ? `• ${finding.componentName}`
                            : ""}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        {finding.ownerName ?? "Unassigned"}
                      </td>

                      <td className="px-6 py-4 text-red-300">
                        {finding.daysOverdue}d overdue
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-4">
            <FileSearch size={22} className="text-cyan-300" />
            <div>
              <h2 className="text-xl font-bold text-white">
                Active SR Delivery SLAs
              </h2>
              <p className="text-sm text-slate-400">
                Security review due dates, staffing, and exception pressure.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr className="border-b border-slate-800">
                  <th className="px-6 py-3 font-medium">SR</th>
                  <th className="px-6 py-3 font-medium">Reviewers</th>
                  <th className="px-6 py-3 font-medium">Scope</th>
                  <th className="px-6 py-3 font-medium">Due</th>
                </tr>
              </thead>

              <tbody>
                {metrics.reviewSlaItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-10 text-center text-slate-500"
                    >
                      No active SRs currently need SLA tracking.
                    </td>
                  </tr>
                )}

                {metrics.reviewSlaItems.map(
                  (review) => (
                    <tr
                      key={review.id}
                      className="border-b border-slate-800/70 hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">
                          {review.srId}
                        </div>
                        <div className="text-xs text-slate-500">
                          {review.sprId ?? review.projectName} •{" "}
                          {review.status}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {review.needsExtension && (
                            <span className="rounded-full bg-pink-500/10 px-2 py-1 text-xs text-pink-300">
                              Extension
                            </span>
                          )}
                          {review.cancellationRequested && (
                            <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-300">
                              Cancellation
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        {review.reviewers.length > 0
                          ? review.reviewers.join(", ")
                          : "Needs assignment"}
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-slate-300">
                          {review.workstreams.length > 0
                            ? review.workstreams.join(", ")
                            : "Not scoped"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {review.findingCount} findings
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div
                          className={reviewDueClass(
                            review.daysUntilDue
                          )}
                        >
                          {review.daysUntilDue === null
                            ? "No date"
                            : review.daysUntilDue < 0
                              ? `${Math.abs(
                                  review.daysUntilDue
                                )}d overdue`
                              : `${review.daysUntilDue}d left`}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDate(review.dueDate)}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
