"use client";

import { useState } from "react";
import {
  Bot,
  ChevronDown,
  Clipboard,
  CheckCircle2,
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

type SectionKey = "prompts" | "compose";

function parseCopilotSections(markdown: string) {
  const lines = markdown.trim().split("\n");
  const title = lines.find((line) => line.startsWith("## "))?.replace(/^##\s+/, "");
  const introLines: string[] = [];
  const sections: { title: string; lines: string[] }[] = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      continue;
    }

    if (line.startsWith("### ")) {
      if (current) {
        sections.push(current);
      }
      current = {
        title: line.replace(/^###\s+/, ""),
        lines: [],
      };
      continue;
    }

    if (current) {
      current.lines.push(line);
    } else if (line.trim()) {
      introLines.push(line);
    }
  }

  if (current) {
    sections.push(current);
  }

  return {
    title: title ?? "Atomix Agent Result",
    intro: introLines.join("\n").trim(),
    sections,
  };
}

function CopilotSectionContent({ lines }: { lines: string[] }) {
  const cleanLines = lines.filter((line) => line.trim());
  const bullets = cleanLines.filter((line) => line.trim().startsWith("- "));
  const paragraphs = cleanLines.filter((line) => !line.trim().startsWith("- "));

  return (
    <div className="space-y-2">
      {paragraphs.map((line, index) => (
        <p key={`${line}-${index}`} className="text-sm leading-7 text-slate-300">
          {line}
        </p>
      ))}
      {bullets.length > 0 && (
        <ul className="space-y-2">
          {bullets.map((line, index) => (
            <li
              key={`${line}-${index}`}
              className="flex gap-2 text-sm leading-7 text-slate-200"
            >
              <CheckCircle2 className="mt-1.5 shrink-0 text-cyan-300" size={15} />
              <span>{line.replace(/^-\s+/, "")}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FormattedCopilotResponse({ response }: { response: string }) {
  const parsed = parseCopilotSections(response);
  const evidenceTitles = [
    "Agent Trace",
    "Synthesis Status",
    "Tool Coverage",
    "Live MCP Observations",
  ];
  const answerSections = parsed.sections.filter(
    (section) => !evidenceTitles.includes(section.title),
  );
  const evidenceSections = parsed.sections.filter((section) =>
    evidenceTitles.includes(section.title),
  );

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
          Atomix Agent
        </p>
        <h3 className="mt-1 text-xl font-black text-white">{parsed.title}</h3>
        {parsed.intro && (
          <p className="mt-2 text-sm leading-7 text-slate-300">{parsed.intro}</p>
        )}
      </div>

      {answerSections.map((section) => (
        <section key={section.title} className="border-t border-slate-800 pt-4">
          <h4 className="mb-2 text-sm font-black uppercase tracking-[0.14em] text-cyan-200">
            {section.title}
          </h4>
          <CopilotSectionContent lines={section.lines} />
        </section>
      ))}

      {evidenceSections.length > 0 && (
        <details className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <summary className="cursor-pointer list-none text-sm font-bold text-slate-300">
            Show MCP evidence, trace, and synthesis status
          </summary>
          <div className="mt-4 space-y-4">
            {evidenceSections.map((section) => (
              <section key={section.title} className="border-t border-slate-800 pt-4 first:border-t-0 first:pt-0">
                <h5 className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  {section.title}
                </h5>
                <CopilotSectionContent lines={section.lines} />
              </section>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function CompactTrace({ agentTrace }: { agentTrace: AgentTraceStep[] }) {
  if (agentTrace.length === 0) {
    return null;
  }

  return (
    <details className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
      <summary className="cursor-pointer list-none text-sm font-bold text-slate-300">
        MCP tool path · {agentTrace.length} step{agentTrace.length === 1 ? "" : "s"}
      </summary>
      <div className="mt-3 space-y-2">
        {agentTrace.map((step, index) => (
          <div
            key={`${step.toolName ?? "trace"}-${index}`}
            className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs leading-5 text-slate-300"
          >
            <span className="font-bold text-cyan-200">
              Step {step.step ?? index + 1}: {step.toolName ?? "tool"}
            </span>
            {typeof step.elapsedMs === "number" && (
              <span className="text-slate-500"> · {step.elapsedMs}ms</span>
            )}
            <p className="mt-1 text-slate-400">
              {step.summary ?? step.status ?? "Completed"}
            </p>
          </div>
        ))}
      </div>
    </details>
  );
}

function CollapseButton({
  open,
  title,
  subtitle,
  badge,
  onClick,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-left transition hover:border-cyan-400/30"
    >
      <span>
        <span className="block font-bold text-white">{title}</span>
        {subtitle && (
          <span className="mt-1 block text-xs text-slate-500">{subtitle}</span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {badge && (
          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
            {badge}
          </span>
        )}
        <ChevronDown
          size={18}
          className={`text-slate-400 transition ${open ? "rotate-180" : ""}`}
        />
      </span>
    </button>
  );
}

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
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    prompts: true,
    compose: true,
  });

  function toggleSection(section: SectionKey) {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  async function ask() {
    if (!question.trim()) return;

    setLoading(true);
    setOpenSections((current) => ({
      ...current,
      prompts: false,
      compose: true,
    }));

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
      setResponse(data.answer ?? data.error ?? "No response");
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

        <div className="space-y-3">
          <CollapseButton
            open={openSections.prompts}
            title="Prompt library"
            subtitle="Use a starter prompt, then collapse it to keep the working area short."
            badge={`${promptGroups.reduce((total, group) => total + group.prompts.length, 0)} prompts`}
            onClick={() => toggleSection("prompts")}
          />
          {openSections.prompts && (
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
                        onClick={() => {
                          setQuestion(prompt);
                          setOpenSections((current) => ({
                            ...current,
                            compose: true,
                          }));
                        }}
                        className="w-full rounded-xl bg-slate-800/80 px-3 py-2 text-left text-sm leading-5 text-slate-300 transition hover:bg-cyan-400/10 hover:text-cyan-100"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <CollapseButton
            open={openSections.compose}
            title="Ask Copilot"
            subtitle="Ground a request in reviewer, SLA, evidence, or executive context."
            badge={question.trim() ? "Draft ready" : "Empty"}
            onClick={() => toggleSection("compose")}
          />
          {openSections.compose && (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
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
                rows={4}
                placeholder="Ask Atomix to summarize governance risk, draft a call brief, check reviewer gaps, or create a QA checklist..."
                className="w-full resize-y bg-transparent p-2 text-base leading-7 text-white outline-none placeholder:text-slate-600"
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
          )}
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
                {mode === "mcp-agentic"
                  ? "MCP tool loop"
                  : mode === "mcp-deterministic"
                    ? "MCP deterministic"
                    : "Prompt fallback"}
              </span>
            )}
          </div>
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
            <FormattedCopilotResponse response={response} />
            <CompactTrace agentTrace={agentTrace} />
          </div>
        </section>
      )}
    </div>
  );
}
