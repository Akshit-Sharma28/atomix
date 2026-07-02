"use client";

import { useState } from "react";
import {
  Bot,
  Clipboard,
  GitBranch,
  FileText,
  Loader2,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";

const promptGroups = [
  {
    title: "Executive Governance",
    prompts: [
      "Draft a one-page executive governance brief from current red work, variance, extensions, and overdue reviews.",
      "Summarize weekly governance call attendance, extension requests, and red engagements as an email.",
    ],
  },
  {
    title: "Reviewer Operations",
    prompts: [
      "Recommend reviewer assignments based on availability, role fit, and active SR load.",
      "Compare Dedicated Pool and Augmentation Pool load and highlight staffing risks.",
    ],
  },
  {
    title: "Review Quality",
    prompts: [
      "Find peer review gaps across active SRs and list missing evidence.",
      "Create a QA checklist for FEAD, BEAD, LLM FEAD, and scan evidence review.",
    ],
  },
];

type AgentTraceStep = {
  step?: number;
  toolName?: string;
  elapsedMs?: number;
  status?: string;
  summary?: string;
};

export default function CopilotChat({
  initialPrompt = "",
}: {
  initialPrompt?: string;
}) {
  const [question, setQuestion] = useState(initialPrompt);
  const [response, setResponse] = useState("");
  const [mode, setMode] = useState("");
  const [agentTrace, setAgentTrace] = useState<AgentTraceStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function ask() {
    if (!question.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
        }),
      });

      const data = await res.json();
      setResponse(data.answer ?? "No response");
      setMode(typeof data.mode === "string" ? data.mode : "");
      setAgentTrace(Array.isArray(data.agentTrace) ? data.agentTrace : []);
    } catch {
      setResponse("Unable to contact Copilot");
      setMode("");
      setAgentTrace([]);
    }

    setLoading(false);
  }

  async function copyResponse() {
    if (!response) return;
    await navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-cyan-500/20 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/10">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
              <Sparkles size={16} />
              Ask Atomix Copilot
            </div>
            <h2 className="text-2xl font-bold text-white">
              Governance command assistant
            </h2>
            <p className="mt-2 max-w-3xl text-slate-400">
              Draft leadership narratives, reviewer actions, FEAD evidence
              checks, interview governance summaries, and weekly call updates.
              Copilot is advisory: no automatic record writes.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            Human-approved workflow · safe draft mode
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {promptGroups.map((group) => (
            <div
              key={group.title}
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30"
            >
              <p className="mb-3 flex items-center gap-2 font-bold text-white">
                <Wand2 size={16} className="text-cyan-300" />
                {group.title}
              </p>
              <div className="space-y-2">
                {group.prompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setQuestion(prompt)}
                    className="w-full rounded-xl bg-slate-800/80 px-3 py-2 text-left text-sm leading-5 text-slate-300 transition hover:bg-cyan-400/10 hover:text-cyan-100"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {[
              "Reviewer allocation",
              "SLA / extensions",
              "FEAD evidence",
              "Interview governance",
              "Executive summary",
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setQuestion(`${chip}: summarize current risks and next actions.`)}
                className="rounded-full border border-slate-800 px-3 py-1 text-slate-400 hover:border-cyan-400/30 hover:text-cyan-200"
              >
                {chip}
              </button>
            ))}
          </div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={7}
            placeholder="Ask Atomix to summarize governance risk, draft a call brief, check reviewer gaps, or create a QA checklist..."
            className="w-full resize-none bg-transparent p-2 text-lg leading-8 text-white outline-none placeholder:text-slate-600"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
            <p className="text-sm text-slate-500">
              Tip: mention role, SPR/SR, evidence type, pool, risk level, or
              time period for sharper answers.
            </p>
            <button
              onClick={ask}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-6 py-3 font-bold text-slate-950 disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              {loading ? "Thinking..." : "Ask Copilot"}
            </button>
          </div>
        </div>
      </section>

      {response && (
        <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                <Bot size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Copilot Response</h2>
                <p className="text-sm text-slate-500">
                  Review before using in reports or workflow actions.
                </p>
              </div>
            </div>
            <button
              onClick={copyResponse}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-4 py-2 font-semibold text-slate-200 hover:bg-slate-800"
            >
              <Clipboard size={16} />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1 text-slate-400">
              <FileText size={13} />
              Draft output
            </span>
            <span className="rounded-full bg-slate-950 px-3 py-1 text-slate-400">
              No automatic writes
            </span>
            {mode && (
              <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-cyan-200">
                {mode === "mcp-agentic" ? "MCP tool loop" : "Prompt fallback"}
              </span>
            )}
          </div>
          {agentTrace.length > 0 && (
            <div className="mb-4 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.04] p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-bold text-cyan-100">
                <GitBranch size={15} />
                Agent Trace
              </p>
              <div className="space-y-2">
                {agentTrace.map((step, index) => (
                  <div
                    key={`${step.toolName ?? "trace"}-${index}`}
                    className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs leading-5 text-slate-300"
                  >
                    <span className="font-bold text-cyan-200">
                      Step {step.step ?? index + 1}: {step.toolName ?? "tool"}
                    </span>
                    {typeof step.elapsedMs === "number" && (
                      <span className="text-slate-500">
                        {" "}
                        - {step.elapsedMs}ms
                      </span>
                    )}
                    <p className="mt-1 text-slate-400">
                      {step.summary ?? step.status ?? "Completed"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="max-h-[520px] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-sm leading-7 text-slate-200">
            {response}
          </div>
        </section>
      )}
    </div>
  );
}
