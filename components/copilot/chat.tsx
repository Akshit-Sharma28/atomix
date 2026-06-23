"use client";

import { useState } from "react";
import {
  Bot,
  Clipboard,
  Loader2,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";

const promptGroups = [
  {
    title: "Leadership",
    prompts: [
      "Draft a one-page executive governance brief from current red work, variance, extensions, and overdue reviews.",
      "Summarize which governance signals need attention this week.",
    ],
  },
  {
    title: "Reviewer Ops",
    prompts: [
      "Recommend reviewer assignments based on availability, role fit, and active SR load.",
      "Show overdue reviews and suggest the next governance action for each.",
    ],
  },
  {
    title: "Quality",
    prompts: [
      "Find peer review gaps across active reviews and list what evidence is missing.",
      "Create a QA checklist for FEAD, BEAD, LLM FEAD, and scan evidence review.",
    ],
  },
];

export default function CopilotChat({
  initialPrompt = "",
}: {
  initialPrompt?: string;
}) {
  const [question, setQuestion] = useState(initialPrompt);
  const [response, setResponse] = useState("");
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
    } catch {
      setResponse("Unable to contact Copilot");
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
      <section className="rounded-[2rem] border border-cyan-500/20 bg-slate-900/80 p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
              <Sparkles size={16} />
              Ask Atomix
            </div>
            <h2 className="text-2xl font-bold text-white">
              Governance command assistant
            </h2>
            <p className="mt-2 max-w-3xl text-slate-400">
              Ask for summaries, reviewer coordination, evidence gaps, report
              language, and next actions. Copilot reads current Atomix context
              and the Knowledge Base.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-400">
            Human-approved · no automatic record writes
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {promptGroups.map((group) => (
            <div
              key={group.title}
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
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
                    className="w-full rounded-xl bg-slate-800/80 px-3 py-2 text-left text-sm leading-5 text-slate-300 transition hover:bg-slate-700 hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={7}
            placeholder="Ask Atomix to summarize governance risk, draft a call brief, check reviewer gaps, or create a QA checklist..."
            className="w-full resize-none bg-transparent p-2 text-lg leading-8 text-white outline-none placeholder:text-slate-600"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
            <p className="text-sm text-slate-500">
              Tip: mention role, portfolio, SR, evidence type, or time period
              for sharper answers.
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
          <div className="max-h-[520px] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-sm leading-7 text-slate-200">
            {response}
          </div>
        </section>
      )}
    </div>
  );
}
