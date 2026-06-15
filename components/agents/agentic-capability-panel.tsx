import Link from "next/link";
import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  FileText,
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
    eyebrow: "Agentic Governance Layer",
    title: "Agents that watch capacity, red work, and reviewer flow.",
    description:
      "Use Atomix agents as the coordination layer between governance and reviewers: they highlight bottlenecks, summarize delivery risk, and recommend next actions without changing source records automatically.",
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
    eyebrow: "Agentic Leadership Layer",
    title: "Agents that turn delivery signals into executive decisions.",
    description:
      "Executive agents convert portfolio variance, overdue reviews, critical exposure, and trend data into concise leadership narratives and decision prompts.",
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
    eyebrow: "Agentic Workflow Layer",
    title: "Agents that assist intake, assignment, and handoff quality.",
    description:
      "Workflow agents help governance create clean SR records, select reviewers, balance capacity, and prepare reviewer handoff notes.",
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
          "Checks whether APIM, SPR, SR, due date, priority, and review type are complete enough for assignment.",
        prompt:
          "Review the intake workflow and list missing data fields that should be captured before assigning reviewers.",
      },
      {
        title: "Handoff Agent",
        detail:
          "Generates reviewer handoff notes with scope, due date, expected output, and peer-review expectations.",
        prompt:
          "Create reviewer handoff notes for newly assigned security reviews, including scope, deadline, evidence expectations, and QA checkpoints.",
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
}: AgenticCapabilityPanelProps) {
  const config = agentConfigs[context];

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

        <Link
          href={promptHref(config.agents[0].prompt)}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
        >
          <Bot size={16} />
          Ask Atomix Agent
        </Link>
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
              <Link
                href={promptHref(agent.prompt)}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
              >
                <FileText size={15} />
                Run agent prompt
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
