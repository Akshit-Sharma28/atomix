import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
} from "@/services/users/current-user.service";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  User,
} from "lucide-react";

function daysUntil(date: Date) {
  return Math.ceil(
    (date.getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

function severityClass(severity: string) {
  if (severity === "Critical") return "text-red-300";
  if (severity === "High") return "text-orange-300";
  if (severity === "Medium") return "text-yellow-300";
  return "text-emerald-300";
}

export default async function MyFindingsPage() {
  const currentUser =
    await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="p-8 text-slate-300">
        User not found
      </div>
    );
  }

  const findings =
    await prisma.finding.findMany({
      where: {
        ownerId: currentUser.id,
      },
      include: {
        project: true,
        review: true,
        component: true,
        analysis: true,
        remediationPlan: true,
      },
      orderBy: [
        {
          dueDate: "asc",
        },
        {
          severity: "asc",
        },
      ],
    });

  const activeFindings =
    findings.filter(
      (finding) =>
        finding.status !== "Closed"
    );

  const overdue =
    activeFindings.filter(
      (finding) =>
        finding.dueDate &&
        finding.dueDate < new Date()
    );

  const dueSoon =
    activeFindings.filter((finding) => {
      if (!finding.dueDate) return false;
      const days =
        daysUntil(finding.dueDate);
      return days >= 0 && days <= 7;
    });

  const readyForRetest =
    activeFindings.filter(
      (finding) =>
        finding.status ===
        "Ready For Retest"
    );

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <User
            size={40}
            className="text-cyan-400"
          />

          <div>
            <div className="mb-2 text-sm text-slate-500">
              Personal Queue
            </div>

            <h1 className="text-4xl font-bold text-white">
              My Findings
            </h1>

            <p className="mt-2 text-slate-400">
              Remediation work assigned to {currentUser.name}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Assigned</span>
            <ShieldAlert size={20} className="text-cyan-300" />
          </div>
          <div className="mt-3 text-3xl font-bold text-cyan-300">
            {findings.length}
          </div>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Overdue</span>
            <AlertTriangle size={20} className="text-red-300" />
          </div>
          <div className="mt-3 text-3xl font-bold text-red-300">
            {overdue.length}
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-500/20 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Due 7d</span>
            <Clock3 size={20} className="text-yellow-300" />
          </div>
          <div className="mt-3 text-3xl font-bold text-yellow-300">
            {dueSoon.length}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span>Ready Retest</span>
            <CheckCircle2 size={20} className="text-emerald-300" />
          </div>
          <div className="mt-3 text-3xl font-bold text-emerald-300">
            {readyForRetest.length}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-6 py-4">
          <h2 className="text-xl font-bold text-white">
            Assigned Remediation Items
          </h2>
          <p className="text-sm text-slate-400">
            Sorted by due date with SPR/SR context for quick triage.
          </p>
        </div>

        <div className="divide-y divide-slate-800">
          {findings.length === 0 && (
            <div className="p-12 text-center">
              <ShieldAlert
                size={48}
                className="mx-auto mb-4 text-slate-600"
              />
              <p className="text-slate-400">
                No findings assigned. The queue goblin is asleep.
              </p>
            </div>
          )}

          {findings.map((finding) => {
            const dueDays =
              finding.dueDate
                ? daysUntil(finding.dueDate)
                : null;

            return (
              <Link
                key={finding.id}
                href={`/findings/${finding.id}`}
                className="block p-5 transition-all hover:bg-slate-800/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {finding.title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {finding.project.sprId ?? finding.project.name}
                      {" · "}
                      {finding.review?.srId ??
                        finding.review?.title ??
                        "No SR"}
                      {finding.component?.name
                        ? ` · ${finding.component.name}`
                        : ""}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full bg-slate-950 px-3 py-1 text-xs ${severityClass(
                          finding.severity
                        )}`}
                      >
                        {finding.severity}
                      </span>
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                        {finding.status}
                      </span>
                      {finding.analysis && (
                        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                          AI analyzed
                        </span>
                      )}
                      {finding.remediationPlan && (
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                          Plan exists
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={
                        dueDays === null
                          ? "text-slate-500"
                          : dueDays < 0
                            ? "text-red-300"
                            : dueDays <= 7
                              ? "text-yellow-300"
                              : "text-emerald-300"
                      }
                    >
                      {dueDays === null
                        ? "No due date"
                        : dueDays < 0
                          ? `${Math.abs(dueDays)}d overdue`
                          : `${dueDays}d left`}
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {finding.dueDate
                        ? finding.dueDate.toLocaleDateString()
                        : "Set target date"}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
