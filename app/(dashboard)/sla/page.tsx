import Link from "next/link";
import SLAKPIs from "@/components/sla/sla-kpis";
import {
  getSLAMetrics,
} from "@/services/sla/sla-dashboard.service";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Gauge,
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

const peerReviewRules = [
  ["Critical", "24 hours", "Same-day governance escalation"],
  ["High", "48 hours", "Priority peer reviewer queue"],
  ["Medium", "72 hours", "Standard peer-review queue"],
  ["Low", "5 business days", "Batch with weekly governance call"],
];

const peerReviewKpis = [
  ["Total peer reviews pending", 14, "open peer-review items"],
  ["Within SLA", 9, "healthy queue"],
  ["Near SLA breach", 3, "inside 20% of target"],
  ["Breached SLA", 2, "requires governance action"],
  ["Avg peer review turnaround", "39h", "last 30 days"],
];

export default async function SLAPage() {
  const metrics =
    await getSLAMetrics();

  const healthScore = Math.max(
    0,
    Math.min(
      100,
      metrics.compliancePercent -
        metrics.overdueReviews * 8 -
        metrics.unassignedReviews * 5 -
        metrics.extensionRequests * 3
    )
  );

  const healthLabel =
    healthScore >= 85
      ? "Healthy"
      : healthScore >= 70
        ? "Watch"
        : "At Risk";

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-8 border-b border-slate-800 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 pr-0 xl:pr-72">
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

      <section className="mt-8 rounded-2xl border border-cyan-500/20 bg-slate-900 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-cyan-300">
              <FileSearch size={18} />
              Peer Reviewer SLA Engine
            </div>
            <h2 className="mt-3 text-2xl font-bold text-white">
              Peer review targets, not main reviewer targets
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
              Governance/Admin can tune these peer-review SLA rules in code for
              the demo. The monitoring KPIs below track the independent peer
              reviewer queue before final governance validation.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {peerReviewKpis.map(([label, value, helper]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-3xl font-black text-white">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{helper}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {peerReviewRules.map(([severity, target, action]) => (
            <label
              key={severity}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
            >
              <span className="block text-sm font-semibold text-white">
                {severity}
              </span>
              <input
                defaultValue={target}
                className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-cyan-200"
              />
              <span className="mt-2 block text-xs text-slate-500">
                {action}
              </span>
            </label>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-cyan-300">
                <Gauge size={18} />
                Delivery Health
              </div>
              <h2 className="mt-3 text-3xl font-bold text-white">
                {healthScore}/100 · {healthLabel}
              </h2>
              <p className="mt-2 max-w-3xl text-slate-400">
                Score starts with finding SLA compliance, then subtracts delivery
                pressure from overdue SRs, unassigned SRs, and open extension
                requests. It is a governance triage signal, not a compliance
                certificate.
              </p>
            </div>

            <div className="min-w-56 rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                <span>Health Meter</span>
                <span>{healthScore}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-300"
                  style={{ width: `${healthScore}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Use this to prioritize weekly follow-ups.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {[
              ["Critical", metrics.severityCounts.Critical ?? 0, "text-red-300"],
              ["High", metrics.severityCounts.High ?? 0, "text-orange-300"],
              ["Medium", metrics.severityCounts.Medium ?? 0, "text-yellow-300"],
              ["Low", metrics.severityCounts.Low ?? 0, "text-emerald-300"],
            ].map(([label, value, color]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {label}
                </p>
                <p className={`mt-2 text-3xl font-bold ${color}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-cyan-300">
            <ClipboardCheck size={18} />
            SLA Rules
          </div>
          <h2 className="mt-3 text-2xl font-bold text-white">
            Remediation Targets
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ["Critical", "7 days", "Immediate owner follow-up"],
              ["High", "14 days", "Weekly governance tracking"],
              ["Medium", "30 days", "Plan and target date required"],
              ["Low", "60 days", "Track to closure or exception"],
            ].map(([severity, target, action]) => (
              <div
                key={severity}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-white">{severity}</p>
                  <p className="text-xs text-slate-500">{action}</p>
                </div>
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-cyan-300">
                  {target}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

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

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-pink-500/20 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="text-xl font-bold text-white">
              Extension Queue
            </h2>
            <p className="text-sm text-slate-400">
              SRs asking for more time before closure.
            </p>
          </div>
          <div className="divide-y divide-slate-800">
            {metrics.extensionQueue.length === 0 && (
              <p className="p-6 text-sm text-slate-500">
                No extension requests.
              </p>
            )}
            {metrics.extensionQueue.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <p className="font-semibold text-white">{item.srId}</p>
                <p className="text-sm text-slate-400">{item.projectName}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Until {formatDate(item.requestedUntil)} · {item.reason}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-yellow-500/20 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="text-xl font-bold text-white">
              Exceptions Expiring
            </h2>
            <p className="text-sm text-slate-400">
              Accepted risk records close to expiry.
            </p>
          </div>
          <div className="divide-y divide-slate-800">
            {metrics.exceptionQueue.length === 0 && (
              <p className="p-6 text-sm text-slate-500">
                No exceptions expiring in 30 days.
              </p>
            )}
            {metrics.exceptionQueue.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <Link
                  href={`/findings/${item.findingId}`}
                  className="font-semibold text-white hover:text-cyan-300"
                >
                  {item.findingTitle}
                </Link>
                <p className="text-sm text-slate-400">
                  {item.sprId ?? item.projectName} · {item.severity}
                </p>
                <p className="mt-2 text-xs text-yellow-300">
                  {item.daysUntil}d left · {item.status}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-500/20 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="text-xl font-bold text-white">
              Remediation Plans Due
            </h2>
            <p className="text-sm text-slate-400">
              Owner plans with target dates in 14 days.
            </p>
          </div>
          <div className="divide-y divide-slate-800">
            {metrics.remediationQueue.length === 0 && (
              <p className="p-6 text-sm text-slate-500">
                No remediation plans due soon.
              </p>
            )}
            {metrics.remediationQueue.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <Link
                  href={`/findings/${item.findingId}`}
                  className="font-semibold text-white hover:text-cyan-300"
                >
                  {item.findingTitle}
                </Link>
                <p className="text-sm text-slate-400">
                  Owner: {item.ownerName}
                </p>
                <p className="mt-2 text-xs text-emerald-300">
                  {item.daysUntil}d left · {item.status}
                </p>
              </div>
            ))}
          </div>
        </section>
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
