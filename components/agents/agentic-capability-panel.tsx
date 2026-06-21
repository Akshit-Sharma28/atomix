"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Loader2,
  Radar,
  Sparkles,
  UserCheck,
} from "lucide-react";

type AgentAction = {
  title: string;
  detail: string;
  prompt: string;
};

type AgenticCapabilityPanelProps = {
  context: "governance" | "executive" | "workflow";
  metrics?: {
    label: string;
    value: string | number;
  }[];
  runInline?: boolean;
};

const agentConfigs: Record<
  AgenticCapabilityPanelProps["context"],
  {
    eyebrow: string;
    title: string;
    description: string;
    agents: AgentAction[];
  }
> = {
  governance: {
    eyebrow: "Agent-Assisted Governance Layer",
    title: "Copiloted workflows for capacity, red work, and reviewer flow.",
    description:
      "Use Atomix workflow agents as a governed coordination layer: they highlight bottlenecks, summarize delivery risk, and recommend next actions without changing source records automatically.",
    agents: [
      {
        title: "Governance Agent",
        detail:
          "Prioritizes unassigned SRs, over-allocation, extensions, overdue work, and reviewer availability.",
        prompt:
          "Analyze current reviewer capacity, red engagements, unassigned SRs, and extension pressure. Recommend the top governance actions for this week.",
      },
      {
        title: "Peer Review Agent",
        detail:
          "Flags reviews that need QA attention, stale evidence, missing ownership, or reviewer conflict.",
        prompt:
          "Review the active SR delivery board and identify which reviews need peer review or QA intervention first.",
      },
      {
        title: "Pentest Copilot Agent",
        detail:
          "Assists reviewers with finding drafting, remediation language, and delivery-ready summaries.",
        prompt:
          "Draft reviewer-ready next steps for active pentest work, including likely evidence gaps and remediation support.",
      },
    ],
  },
  executive: {
    eyebrow: "Agent-Assisted Leadership Layer",
    title: "Copiloted briefs for delivery signals and executive decisions.",
    description:
      "Executive workflows convert portfolio variance, overdue reviews, critical exposure, and trend data into concise leadership narratives and decision prompts.",
    agents: [
      {
        title: "Executive Agent",
        detail:
          "Creates a board-level risk brief with what changed, what is red, and where leadership should intervene.",
        prompt:
          "Generate an executive portfolio brief from project risk, variance, overdue SRs, red projects, and critical open findings.",
      },
      {
        title: "Variance Agent",
        detail:
          "Explains chargeability variance and separates healthy throughput from delivery drag.",
        prompt:
          "Explain the largest delivery variance drivers and what leadership should ask the governance team next.",
      },
      {
        title: "Portfolio Risk Agent",
        detail:
          "Ranks projects by risk concentration, overdue reviews, and pending extensions.",
        prompt:
          "Rank the project portfolio by leadership risk and recommend which projects need escalation this week.",
      },
    ],
  },
  workflow: {
    eyebrow: "Agent-Assisted Workflow Layer",
    title: "Dedicated flows for intake, assignment, and scope quality.",
    description:
      "Structured workflow agents help governance create clean review records, select reviewers, balance capacity, and prepare scope documents before testing starts.",
    agents: [
      {
        title: "Assignment Agent",
        detail:
          "Suggests reviewer fit from availability, capacity, review type, and current allocation.",
        prompt:
          "Recommend reviewer assignments for open SRs using availability, capacity, review type, and current workload.",
      },
      {
        title: "Intake Agent",
        detail:
          "Checks whether review identifiers, due date, priority, and review type are complete enough for assignment.",
        prompt:
          "Review the intake workflow and list missing data fields that should be captured before assigning reviewers.",
      },
      {
        title: "Scope Call Agent",
        detail:
          "Turns demo-call notes into a pre-review scope document with risk, access, RBAC, scans, and architecture assumptions.",
        prompt:
          "Create a pre-review scope document from demo-call notes, including target URL, IP, risk, AV, authentication, RBAC roles, scan reports, BEAD or LLM FEAD needs, and open questions.",
      },
    ],
  },
};

const icons = [Radar, BrainCircuit, UserCheck];

function promptHref(prompt: string) {
  return `/copilot?prompt=${encodeURIComponent(prompt)}`;
}

export default function AgenticCapabilityPanel({
  context,
  metrics = [],
  runInline = false,
}: AgenticCapabilityPanelProps) {
  const config = agentConfigs[context];
  const [activeAgent, setActiveAgent] =
    useState<string | null>(null);
  const [answer, setAnswer] =
    useState("");
  const [isPending, startTransition] =
    useTransition();

  function runAgent(agent: AgentAction) {
    setActiveAgent(agent.title);
    setAnswer("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/copilot", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: agent.prompt,
          }),
        });

        const data = await response.json();

        setAnswer(
          data.answer ??
            data.error ??
            "Agent response unavailable."
        );
      } catch {
        setAnswer(
          "Agent response unavailable. Check local/tunnel AI status and try again."
        );
      }
    });
  }

  return (
    <section className="rounded-[1.75rem] border border-cyan-400/20 bg-cyan-400/[0.04] p-5 shadow-lg shadow-cyan-950/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
            <Sparkles size={14} />
            {config.eyebrow}
          </div>
          <h2 className="max-w-3xl text-2xl font-bold text-white">
            {config.title}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
            {config.description}
          </p>
        </div>

        {runInline ? (
          <button
            type="button"
            onClick={() => runAgent(config.agents[0])}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
          >
            {isPending && activeAgent === config.agents[0].title ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Bot size={16} />
            )}
            Run Executive Brief
          </button>
        ) : (
          <Link
            href={promptHref(config.agents[0].prompt)}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            <Bot size={16} />
            Ask Copilot
          </Link>
        )}
      </div>

      {metrics.length > 0 && (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
            >
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                {metric.label}
              </p>
              <p className="mt-2 text-2xl font-black text-cyan-200">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {config.agents.map((agent, index) => {
          const Icon = icons[index] ?? CheckCircle2;

          return (
            <article
              key={agent.title}
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-cyan-200">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white">
                    {agent.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {agent.detail}
                  </p>
                </div>
              </div>
              {runInline ? (
                <button
                  type="button"
                  onClick={() => runAgent(agent)}
                  disabled={isPending}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200 disabled:opacity-60"
                >
                  {isPending && activeAgent === agent.title ? (
                    <Loader2 className="animate-spin" size={15} />
                  ) : (
                    <FileText size={15} />
                  )}
                  Run here
                </button>
              ) : (
                <Link
                  href={promptHref(agent.prompt)}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                >
                  <FileText size={15} />
                  Open Copilot prompt
                </Link>
              )}
            </article>
          );
        })}
      </div>

      {runInline && (activeAgent || answer) && (
        <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-300">
                Inline Agent Output
              </p>
              <h3 className="mt-1 text-lg font-bold text-white">
                {activeAgent ?? "Executive Agent"}
              </h3>
            </div>
            {isPending && (
              <span className="inline-flex items-center gap-2 rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                <Loader2 className="animate-spin" size={14} />
                Thinking
              </span>
            )}
          </div>
          <div className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-black/20 p-4 text-sm leading-6 text-slate-300">
            {answer ||
              "Running the selected agent against the current portfolio context..."}
          </div>
        </div>
      )}
    </section>
  );
}
