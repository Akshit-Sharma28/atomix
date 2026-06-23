import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Cpu,
  Shield,
} from "lucide-react";

import KPIGrid from "@/components/dashboard/kpi-grid";
import OllamaStatus from "@/components/ai/ollama-status";

import {
  getDashboardMetrics,
  getDashboardWorkspace,
} from "@/services/dashboard/dashboard.service";
import { getCurrentUser } from "@/services/users/current-user.service";
import { normalizeRole } from "@/services/users/access.service";

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();
  const activeRole = normalizeRole(currentUser?.role);

  const [metrics, workspace] = await Promise.all([
    getDashboardMetrics({
      role: activeRole,
      userId: currentUser?.id,
    }),
    getDashboardWorkspace({
      role: activeRole,
      userId: currentUser?.id,
    }),
  ]);

  return (
    <div className="w-full px-8 py-6">
      <div className="-ml-8 mb-6 border-b border-slate-800 pb-5 pl-8">
        <div className="flex items-center justify-between pr-48">
          <div>
            <div className="flex items-center gap-3">
              <Shield size={28} className="text-cyan-400" />
              <h1 className="text-3xl font-bold text-white">
                Dashboard
              </h1>
            </div>
            <p className="mt-2 max-w-3xl text-slate-400">
              {metrics.role?.description ??
                "Operational snapshot of projects, findings, risk posture, AI availability, and remediation progress."}
            </p>
          </div>

        </div>
      </div>

      <div className="mb-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
              {activeRole.replaceAll("_", " ")}
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">
              {metrics.role?.title ?? "Security Operations Dashboard"}
            </h2>
          </div>
        </div>
        <KPIGrid metrics={metrics} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {workspace.actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-cyan-500/30 hover:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-white">
                {action.label}
              </h3>
              <ArrowRight
                size={18}
                className="text-cyan-300 transition-transform group-hover:translate-x-1"
              />
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {action.detail}
            </p>
          </Link>
        ))}
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-6 lg:grid-cols-2">
          {workspace.sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-cyan-500/10 bg-slate-900/60"
            >
              <div className="border-b border-slate-800 p-5">
                <h2 className="text-lg font-bold text-white">
                  {section.title}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {section.subtitle}
                </p>
              </div>

              <div className="divide-y divide-slate-800/80">
                {section.items.length > 0 ? (
                  section.items.map((item, index) => {
                    const toneClass =
                      item.tone === "danger"
                        ? "text-red-300 border-red-500/20 bg-red-500/10"
                        : item.tone === "warn"
                          ? "text-amber-300 border-amber-500/20 bg-amber-500/10"
                          : item.tone === "good"
                            ? "text-emerald-300 border-emerald-500/20 bg-emerald-500/10"
                            : "text-cyan-300 border-cyan-500/20 bg-cyan-500/10";

                    const content = (
                      <div className="flex items-start justify-between gap-4 p-4 transition-all hover:bg-slate-800/40">
                        <div>
                          <p className="font-semibold text-white">
                            {item.label}
                          </p>
                          {item.meta && (
                            <p className="mt-1 text-sm leading-6 text-slate-400">
                              {item.meta}
                            </p>
                          )}
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass}`}>
                          {item.value}
                        </span>
                      </div>
                    );

                    return item.href ? (
                      <Link
                        key={`${section.title}-${item.label}-${index}`}
                        href={item.href}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div key={`${section.title}-${item.label}-${index}`}>
                        {content}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-5 text-sm text-slate-500">
                    No active records for this role right now.
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-cyan-500/10 bg-slate-900/60 p-5">
            <div className="mb-4 flex items-center gap-3">
              <Cpu size={20} className="text-cyan-400" />
              <h2 className="text-lg font-bold">
                Local AI Service
              </h2>
            </div>

            <OllamaStatus />

            <p className="mt-4 text-sm leading-6 text-slate-400">
              AI is used as an assistant for summaries, scope drafts,
              reviewer checks, and governance prompts. Record changes remain
              governed by structured actions and RBAC.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-500/10 bg-slate-900/60 p-5">
            <div className="mb-4 flex items-center gap-3">
              <Bot size={20} className="text-cyan-400" />
              <h2 className="text-lg font-bold">
                Agentic Governance
              </h2>
            </div>

            <p className="mb-4 text-sm leading-6 text-slate-400">
              The dashboard now shows role-aware queues first. Use Copilot
              when you need a narrative brief, and use DB Action Builder when
              a governed record needs to be written.
            </p>

            <div className="space-y-2">
              {[
                ["Ask Copilot", "/copilot"],
                ["DB Action Builder", "/workflow/command-center"],
                ["Knowledge Base", "/knowledge-base"],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="block rounded-lg bg-slate-800 px-3 py-2 text-left transition-all hover:bg-slate-700"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
