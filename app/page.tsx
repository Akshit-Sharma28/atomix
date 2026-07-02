import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  ClipboardCheck,
  FileSearch,
  Gauge,
  GitBranch,
  Radar,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";

const heroStats = [
  ["Scope", "readiness"],
  ["Capacity", "reviewer coverage"],
  ["Quality", "peer review"],
  ["Retest", "closure signals"],
];

const capabilityCards = [
  {
    icon: ClipboardCheck,
    title: "Validator readiness",
    text: "Capture scope, target URLs/IPs, RBAC roles, risk context, artifacts, scan reports, and open prerequisites before work starts.",
  },
  {
    icon: Users,
    title: "Reviewer governance",
    text: "Track reviewer capacity, assignments, peer review queues, reschedules, cancellations, extensions, and weekly governance call updates.",
  },
  {
    icon: RotateCcw,
    title: "Retest coordination",
    text: "Map retest requests to the original review, fixes readiness, access readiness, prior iterations, available retesters, and status.",
  },
  {
    icon: Gauge,
    title: "Leadership reporting",
    text: "Surface hours, chargeability, variance, overdue work, red engagements, extension pressure, and executive-ready delivery summaries.",
  },
];

const workflowSteps = [
  {
    title: "Intake",
    text: "Validator collects scope and prerequisites from the demo call.",
  },
  {
    title: "Assign",
    text: "Governance maps reviewers, QA reviewers, retesters, and capacity.",
  },
  {
    title: "Review",
    text: "Reviewers add evidence, findings, comments, and peer review checks.",
  },
  {
    title: "Retest",
    text: "Fix readiness and retest ownership are tracked through closure.",
  },
  {
    title: "Report",
    text: "Executives get delivery signals, KPI variance, and exception views.",
  },
];

const agents = [
  ["Demo Call Agent", "Builds a scope document from intake notes."],
  ["Peer Review Agent", "Checks FEAD, BEAD, LLM FEAD, and scan evidence."],
  ["DB Action Builder", "Creates governed records through typed forms."],
  ["Security Copilot", "Summarizes queues, gaps, and delivery signals."],
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="atomix-hero-grid absolute inset-0 opacity-55" />
      <div className="atomix-hero-orb atomix-hero-orb-a" />
      <div className="atomix-hero-orb atomix-hero-orb-b" />

      <header className="relative z-10 mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 atomix-logo-pulse sm:h-12 sm:w-12">
            <Image
              src="/atomix-mark.svg"
              alt=""
              width={38}
              height={38}
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-black tracking-tight text-cyan-300 sm:text-2xl">
              ATOMIX
            </p>
            <p className="max-w-[18rem] text-[10px] uppercase tracking-[0.12em] text-slate-500 sm:text-xs sm:tracking-[0.18em]">
              AI-powered Governance Dashboard
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          <a href="#capabilities" className="hover:text-cyan-200">
            Capabilities
          </a>
          <a href="#workflow" className="hover:text-cyan-200">
            Workflow
          </a>
          <a href="#agents" className="hover:text-cyan-200">
            Agents
          </a>
        </nav>

        <Link
          href="/login"
          className="rounded-full border border-cyan-300/30 bg-cyan-300 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
        >
          Login
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 pb-10 pt-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.82fr)] lg:items-center">
        <div className="min-w-0">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
            <Sparkles size={16} />
            Governance dashboard for security review operations
          </div>

          <h1 className="max-w-4xl text-4xl font-black tracking-tight md:text-5xl xl:text-6xl">
            Security Review Governance,
            <span className="block text-cyan-300">
              coordinated with AI assistance.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
            Atomix brings scope readiness, reviewer capacity, evidence quality,
            retest coordination, SLA signals, and leadership reporting into one
            governed operating view for security review teams.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 transition hover:bg-cyan-200"
            >
              Login to Dashboard
              <ArrowRight
                size={18}
                className="transition group-hover:translate-x-1"
              />
            </Link>
            <a
              href="https://twentyeightlab.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 px-6 py-4 font-semibold text-slate-200 transition hover:border-cyan-300/50 hover:text-cyan-100"
            >
              Powered by Twenty Eight Labs
            </a>
          </div>

          <div className="mt-7 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
            {heroStats.map(([value, label]) => (
              <div
                key={value}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 backdrop-blur"
              >
                <p className="text-xl font-black text-white">{value}</p>
                <p className="mt-1 text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-cyan-300/20 bg-slate-950/80 p-4 shadow-2xl backdrop-blur lg:translate-x-6 xl:translate-x-10">
          <div className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                Live Governance View
              </p>
              <h2 className="mt-2 text-xl font-bold">One operating layer</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Track readiness, review ownership, evidence status, peer review
                signals, retest queues, and SLA pressure without changing the
                source review workflow.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    Role-aware cockpit
                  </p>
                  <h2 className="mt-1 text-xl font-bold">Governance signals</h2>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300 text-slate-950">
                  <Bot size={20} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Unassigned", "0", "text-amber-300"],
                  ["Active SRs", "8", "text-cyan-300"],
                  ["Extensions", "0", "text-emerald-300"],
                  ["Red Work", "3", "text-red-300"],
                ].map(([label, value, color]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3"
                  >
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className={`mt-2 text-2xl font-black ${color}`}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-3">
            <div className="mb-3 flex justify-end">
              <span className="rounded bg-cyan-300 px-2 py-1 font-mono text-[10px] font-black text-slate-950">
                TRUST LAYER
              </span>
            </div>
            <div className="atomix-arcade-stage atomix-arcade-wide">
              <div className="atomix-vault-shell">
                <div className="atomix-vault-door" />
                <div className="atomix-vault-lock" />
              </div>
              <div className="atomix-data-packet atomix-data-packet-a">
                CLIENT DATA
              </div>
              <div className="atomix-data-packet atomix-data-packet-b">
                EVIDENCE
              </div>
              <div className="atomix-policy-gate atomix-policy-gate-a">
                RBAC
              </div>
              <div className="atomix-policy-gate atomix-policy-gate-b">
                KMS
              </div>
              <div className="atomix-redacted-output">
                <span />
                <span />
                <span />
              </div>
              <div className="atomix-audit-rail">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="atomix-fight-caption">
                CLIENT DATA SEALED · AI SEES GOVERNED SIGNALS
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="capabilities"
        className="relative z-10 mx-auto max-w-7xl px-6 py-8"
      >
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
              Capabilities
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">
              Built for governance delivery teams.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-400">
            The dashboard focuses on readiness, assignment, review quality,
            retest coordination, and executive delivery signals.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {capabilityCards.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 transition hover:-translate-y-1 hover:border-cyan-300/40"
              >
                <Icon className="text-cyan-300" size={26} />
                <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {item.text}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="workflow"
        className="relative z-10 mx-auto max-w-7xl px-6 py-8"
      >
        <div className="rounded-[2rem] border border-cyan-300/20 bg-slate-950/70 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                Workflow
              </p>
              <h2 className="mt-3 text-3xl font-black">
                One governance flow, role-specific workspaces.
              </h2>
            </div>
            <GitBranch className="text-cyan-300" size={32} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-5">
            {workflowSteps.map((item, index) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-800 bg-black/30 p-4"
              >
                <p className="text-sm font-black text-cyan-300">
                  0{index + 1}
                </p>
                <p className="mt-3 font-bold text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="agents"
        className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-8"
      >
        <div className="grid gap-5 rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
              Agent Layer
            </p>
            <h2 className="mt-3 text-3xl font-black">
              AI assistance for governance decisions.
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Atomix agents draft, summarize, and cross-check work. Record
              changes remain controlled through RBAC and structured actions.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-200"
            >
              Enter Atomix
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {agents.map(([title, text]) => (
              <div
                key={title}
                className="rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-4"
              >
                <div className="mb-3 flex items-center gap-2 text-cyan-200">
                  {title.includes("Peer") ? (
                    <FileSearch size={18} />
                  ) : title.includes("DB") ? (
                    <Radar size={18} />
                  ) : (
                    <BrainCircuit size={18} />
                  )}
                  <p className="font-bold">{title}</p>
                </div>
                <p className="text-sm leading-6 text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
