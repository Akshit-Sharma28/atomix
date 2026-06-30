import { Bot, Brain, DatabaseZap, ShieldCheck, Sparkles } from "lucide-react";

import CopilotChat from "@/components/copilot/chat";
import History from "@/components/copilot/history";
import LocalAiStatus from "@/components/ui/local-ai-status";
import { getConversationHistory } from "@/services/copilot/history.service";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    prompt?: string;
  }>;
}) {
  const history = await getConversationHistory();
  const params = await searchParams;
  const initialPrompt = params.prompt ?? "";

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-8 overflow-hidden rounded-[2rem] border border-cyan-500/20 bg-cyan-500/[0.04] p-6 shadow-2xl shadow-cyan-950/10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-3xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <Bot size={32} />
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
                Governance AI Command Center
              </div>
              <h1 className="text-5xl font-black tracking-tight text-white">
                Atomix Security Copilot
              </h1>
              <p className="mt-2 max-w-3xl text-slate-400">
                Ask portfolio questions, draft weekly governance emails, inspect
                reviewer capacity, summarize red work, and use Knowledge Base
                context without writing records automatically.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <LocalAiStatus />
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <ShieldCheck className="mb-2 text-emerald-300" size={20} />
              <p className="text-sm font-semibold text-white">Governed</p>
              <p className="text-xs text-slate-500">Advisory answers only</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <Brain className="mb-2 text-cyan-300" size={20} />
              <p className="text-sm font-semibold text-white">Context aware</p>
              <p className="text-xs text-slate-500">Uses Atomix + library data</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <DatabaseZap className="mb-2 text-purple-300" size={20} />
              <p className="text-sm font-semibold text-white">Workflow-aware</p>
              <p className="text-xs text-slate-500">SPR, SR, SLA, FEAD, reviewers</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            "Weekly call summary + attendance email",
            "Reviewer allocation and SLA pressure",
            "FEAD / LLM FEAD evidence checklist",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300"
            >
              <Sparkles size={16} className="shrink-0 text-cyan-300" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <CopilotChat initialPrompt={initialPrompt} />
        <History history={history} />
      </div>
    </div>
  );
}
