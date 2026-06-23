import { Bot, Brain, ShieldCheck } from "lucide-react";

import CopilotChat from "@/components/copilot/chat";
import History from "@/components/copilot/history";
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
      <div className="mb-8 border-b border-slate-800 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <Bot size={32} />
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
                Governance AI
              </div>
              <h1 className="text-5xl font-black text-white">
                Security Copilot
              </h1>
              <p className="mt-2 max-w-3xl text-slate-400">
                Ask governance questions, draft summaries, inspect review
                signals, and use knowledge-base context without disrupting the
                workflow.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <ShieldCheck className="mb-2 text-emerald-300" size={20} />
              <p className="text-sm font-semibold text-white">Governed</p>
              <p className="text-xs text-slate-500">Advisory answers only</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <Brain className="mb-2 text-cyan-300" size={20} />
              <p className="text-sm font-semibold text-white">Context aware</p>
              <p className="text-xs text-slate-500">Uses Atomix + library data</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <CopilotChat initialPrompt={initialPrompt} />
        <History history={history} />
      </div>
    </div>
  );
}
