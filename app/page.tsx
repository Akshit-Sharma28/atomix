import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Building2,
  ClipboardCheck,
  FileText,
  Radar,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const metrics = [
  ["Scope", "review intake"],
  ["Evidence", "artifact checks"],
  ["AI", "agent-assisted workflows"],
];

const capabilities = [
  {
    icon: ShieldCheck,
    title: "Pentest Delivery Cockpit",
    text: "Track review scope, reviewer activity, deadlines, evidence, remediation status, and report readiness from one operating layer.",
  },
  {
    icon: BrainCircuit,
    title: "Agentic Security Intelligence",
    text: "Use local or tunneled AI agents to summarize risk, generate reports, suggest remediation, triage findings, and unblock review flows.",
  },
  {
    icon: Radar,
    title: "Reviewer Capacity Analytics",
    text: "Surface reviewer pool health, chargeability variance, delivery exceptions, reschedules, extensions, and overdue delivery risk.",
  },
  {
    icon: FileText,
    title: "Report Automation",
    text: "Turn imported scans, manual findings, and review notes into structured pentest-ready outputs.",
  },
];

const workflow = [
  "Import review scope, artifacts, and scan reports into the delivery cockpit",
  "Map reviews to reviewers, peer review gates, owners, and SLA commitments",
  "Use Atomix agents to analyze delivery risk, capacity, and remediation paths",
  "Generate executive packs and track closure from dashboard to delivery",
];

const deliveryGaps = [
  {
    icon: Building2,
    title: "From system context to delivery action.",
    text: "Atomix makes review execution visible by reviewer, due date, workload, status, and delivery risk.",
  },
  {
    icon: Users,
    title: "Capacity is operational, not static.",
    text: "Atomix shows who is available, what they are assigned to, how many peer reviews are waiting, and which engagements need rescue.",
  },
  {
    icon: ClipboardCheck,
    title: "Delivery needs workflow intelligence.",
    text: "Review metadata becomes actionable through red engagement flags, extension tracking, chargeability variance, and agent-assisted summaries.",
  },
];

const agents = [
  "Delivery Triage Agent",
  "Executive Agent",
  "Peer Review Agent",
  "Pentest Copilot Agent",
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="atomix-hero-grid absolute inset-0 opacity-60" />
      <div className="atomix-hero-orb atomix-hero-orb-a" />
      <div className="atomix-hero-orb atomix-hero-orb-b" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 atomix-logo-pulse">
            <ShieldCheck className="text-cyan-200" size={24} />
          </div>
          <div>
            <p className="text-2xl font-black tracking-tight text-cyan-300">
              ATOMIX
            </p>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              AI-Powered Pentest Platform
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a href="#capabilities" className="hover:text-cyan-200">
            Capabilities
          </a>
          <a href="#workflow" className="hover:text-cyan-200">
            Workflow
          </a>
          <a href="#delivery" className="hover:text-cyan-200">
            Delivery
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

      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 pb-14 pt-8 lg:grid-cols-12 lg:pt-12">
        <div className="lg:col-span-7">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
            <Sparkles size={16} />
            AI cockpit for modern pentest teams
          </div>

          <h1 className="max-w-5xl text-5xl font-black tracking-tight md:text-6xl">
            Pentest delivery,
            <span className="block text-cyan-300">reviewed with AI assistance.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Atomix turns review scope, Word artifacts, scan reports, findings,
            and reviewer activity into a live operating surface for peer review,
            SLA work, chargeability, and executive reporting.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
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

          <div className="mt-8 grid max-w-2xl grid-cols-3 gap-4">
            {metrics.map(([value, label]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 backdrop-blur"
              >
                <p className="text-3xl font-black text-white">{value}</p>
                <p className="mt-1 text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="atomix-dashboard-card relative rounded-[2rem] border border-cyan-300/20 bg-slate-950/80 p-5 shadow-2xl backdrop-blur">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  Live Preview
                </p>
                <h2 className="text-2xl font-bold">Delivery Dashboard</h2>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-slate-950">
                <Bot size={24} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ["Critical", "5", "text-red-300"],
                ["High", "5", "text-orange-300"],
                ["Open", "11", "text-blue-300"],
                ["Closed", "1", "text-emerald-300"],
              ].map(([label, value, color]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
                >
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className={`mt-2 text-3xl font-black ${color}`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold">Atomix Copilot</p>
                <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-xs text-emerald-300">
                  Local AI Ready
                </span>
              </div>
              {[
                "Generate Pentest Report",
                "Review Findings",
                "Suggest Remediation",
                "Check Peer Review Gaps",
              ].map((item) => (
                <div
                  key={item}
                  className="mb-2 rounded-xl bg-slate-800/80 px-4 py-3 text-sm text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-cyan-300/20 bg-black p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-200">
                  Atomix 8-bit Intro
                </p>
                <span className="rounded bg-cyan-300 px-2 py-1 font-mono text-[10px] font-black text-slate-950">
                  ROUND 01
                </span>
              </div>
              <div className="atomix-arcade-stage">
                <div className="atomix-pixel atomix-hero-sprite">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="atomix-pixel atomix-attacker-sprite">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="atomix-laser" />
                <div className="atomix-shield-burst" />
                <div className="atomix-packet atomix-packet-a">0101</div>
                <div className="atomix-packet atomix-packet-b">XSS</div>
                <div className="atomix-fight-caption">
                  ATOMIX BLOCKED INTRUSION
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="capabilities"
        className="relative z-10 mx-auto max-w-7xl px-6 py-12"
      >
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
              Capabilities
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">
              Built for security delivery teams.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-400">
            Atomix focuses on the execution layer: reviewer capacity, peer
            review, SLA progress, delivery exceptions, extensions, and executive
            reporting.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 transition hover:-translate-y-1 hover:border-cyan-300/40"
              >
                <Icon className="text-cyan-300" size={28} />
                <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {item.text}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section
        id="delivery"
        className="relative z-10 mx-auto max-w-7xl px-6 py-10"
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {deliveryGaps.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-3xl border border-cyan-300/15 bg-slate-950/70 p-6"
              >
                <Icon className="text-cyan-300" size={28} />
                <h3 className="mt-5 text-xl font-bold">
                  {item.title}
                </h3>
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
        className="relative z-10 mx-auto max-w-7xl px-6 py-12"
      >
        <div className="rounded-[2rem] border border-cyan-300/20 bg-slate-950/70 p-6 md:p-10">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            Workflow
          </p>
          <h2 className="mt-3 text-3xl font-black">
            From scan import to executive report.
          </h2>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            {workflow.map((item, index) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-800 bg-black/30 p-5"
              >
                <p className="text-sm font-black text-cyan-300">
                  0{index + 1}
                </p>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="agents"
        className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-10"
      >
        <div className="grid grid-cols-1 gap-6 rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 md:grid-cols-12 md:p-10">
          <div className="md:col-span-8">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
              Powered by Twenty Eight Labs
            </p>
            <h2 className="mt-3 text-3xl font-black">
              Agentic workflows for pentest delivery.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Atomix is built by Twenty Eight Labs to turn pentest operations
              into assisted workflows: delivery triage, executive reporting,
              peer review, and practitioner copilot support.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {agents.map((agent) => (
                <div
                  key={agent}
                  className="rounded-2xl border border-cyan-300/15 bg-cyan-300/5 px-4 py-3 text-sm font-semibold text-cyan-100"
                >
                  {agent}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center md:col-span-4 md:justify-end">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 transition hover:bg-cyan-200"
            >
              Enter Atomix
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
