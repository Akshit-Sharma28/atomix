"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  FileText,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  llmPromptCategories,
  llmPromptLibrary,
  type LlmPromptScenario,
} from "@/services/reviewer-copilot/llm-prompt-library";

type WebFinding = {
  check: string;
  severity: string;
  status: string;
  evidence: string;
  recommendation: string;
  control: string;
};

type WebReviewResult = {
  target: string;
  finalUrl: string;
  scannedAt: string;
  durationMs: number;
  score: number;
  grade: string;
  posture: string;
  summary: string;
  findings: WebFinding[];
  quickReviewActions: string[];
};

const appTypes = ["Web", "API", "Web + API", "Web + LLM", "LLM only", "Thick Client"];
const authModels = ["SSO", "Form login", "JWT/API token", "No auth", "Multiple auth paths"];
const riskLevels = ["High", "Medium", "Low"];

function severityClass(severity: string) {
  if (severity === "critical" || severity === "high") {
    return "border-red-500/30 bg-red-950/20 text-red-200";
  }

  if (severity === "medium") {
    return "border-amber-500/30 bg-amber-950/20 text-amber-200";
  }

  if (severity === "pass") {
    return "border-emerald-500/30 bg-emerald-950/20 text-emerald-200";
  }

  return "border-slate-700 bg-slate-950 text-slate-300";
}

function promptToCopilot(
  plan: {
    targetUrl: string;
    appType: string;
    authModel: string;
    roles: string;
    risk: string;
    scopeNotes: string;
  },
  selectedPrompt?: LlmPromptScenario
) {
  return [
    "Act as Atomix Reviewer Copilot for an authorized security review.",
    "Create a concise reviewer test plan with FEAD/BEAD controls, evidence to collect, and manual validation steps.",
    `Target URL: ${plan.targetUrl || "Not provided"}`,
    `Application type: ${plan.appType}`,
    `Authentication model: ${plan.authModel}`,
    `Roles/RBAC in scope: ${plan.roles || "Not provided"}`,
    `Overall risk: ${plan.risk}`,
    `Scope notes: ${plan.scopeNotes || "Not provided"}`,
    selectedPrompt
      ? `Include this LLM test scenario: ${selectedPrompt.title} (${selectedPrompt.category}). Payload: ${selectedPrompt.payload}. Expected safe signal: ${selectedPrompt.expectedSignal}`
      : "No LLM payload selected.",
    "Return sections: review priorities, passive checks, manual tests, evidence checklist, and questions for the project team.",
  ].join("\n");
}

export default function ReviewerCopilotAgent() {
  const [targetUrl, setTargetUrl] = useState("");
  const [webResult, setWebResult] = useState<WebReviewResult | null>(null);
  const [webError, setWebError] = useState("");
  const [webLoading, setWebLoading] = useState(false);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState(llmPromptLibrary[0].id);
  const [copilotResponse, setCopilotResponse] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [plan, setPlan] = useState({
    targetUrl: "",
    appType: "Web + LLM",
    authModel: "SSO",
    roles: "Admin, Standard User",
    risk: "High",
    scopeNotes: "",
  });

  const filteredPrompts = useMemo(() => {
    const normalizedQuery = query.toLowerCase();

    return llmPromptLibrary.filter((prompt) => {
      const categoryMatch = category === "All" || prompt.category === category;
      const queryMatch =
        !normalizedQuery ||
        [
          prompt.title,
          prompt.category,
          prompt.objective,
          prompt.payload,
          prompt.controlRefs.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return categoryMatch && queryMatch;
    });
  }, [category, query]);

  const selectedPrompt =
    llmPromptLibrary.find((prompt) => prompt.id === selectedPromptId) ??
    llmPromptLibrary[0];

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  }

  async function runWebReview() {
    setWebLoading(true);
    setWebError("");
    setWebResult(null);

    try {
      const response = await fetch("/api/reviewer-copilot/web-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to run passive review.");
      }

      setWebResult(data);
      setPlan((current) => ({
        ...current,
        targetUrl,
        scopeNotes:
          current.scopeNotes ||
          `Passive web posture score ${data.score}/100 (${data.grade}). Review high/medium findings before manual testing.`,
      }));
    } catch (error) {
      setWebError(error instanceof Error ? error.message : "Unable to run passive review.");
    }

    setWebLoading(false);
  }

  async function askCopilot() {
    setCopilotLoading(true);
    setCopilotResponse("");

    try {
      const question = promptToCopilot(plan, selectedPrompt);
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      setCopilotResponse(data.answer ?? "No copilot response returned.");
    } catch {
      setCopilotResponse("Unable to contact Security Copilot.");
    }

    setCopilotLoading(false);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-cyan-500/20 bg-slate-900/70 p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
              <ShieldCheck size={18} />
              Reviewer Copilot Agent
            </div>
            <h2 className="text-3xl font-bold text-white">
              Pentest review assistant with passive web checks and LLM test prompts.
            </h2>
            <p className="mt-3 max-w-4xl text-slate-400">
              Use this workspace during an authorized review to triage a public endpoint, build a reviewer checklist,
              select LLM security scenarios, and send structured context to Atomix Copilot without leaving the review flow.
            </p>
          </div>
          <a
            href="https://twentyeightlab.com/tools/webapp-quick-test"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 px-5 py-3 font-semibold text-cyan-200 hover:bg-cyan-400/10"
          >
            Open T28 Quick Review
            <ExternalLink size={18} />
          </a>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Passive posture", "Headers, TLS, CSP, CORS, cookies"],
            ["Reviewer checklist", "Scope, RBAC, evidence, controls"],
            ["LLM prompt bank", `${llmPromptLibrary.length} scenarios`],
            ["Copilot ready", "Structured prompts, not raw JSON"],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-lg font-bold text-white">{title}</p>
              <p className="mt-2 text-sm text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-white">Quick Web Security Review</h3>
              <p className="mt-1 text-slate-400">
                Passive preliminary checks for public review targets. No exploit payloads or internal network probing.
              </p>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-950/20 px-4 py-2 text-sm font-semibold text-emerald-200">
              Passive only
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={targetUrl}
              onChange={(event) => setTargetUrl(event.target.value)}
              placeholder="https://example.com"
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none focus:border-cyan-400"
            />
            <button
              onClick={runWebReview}
              disabled={webLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 disabled:opacity-60"
            >
              {webLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              Analyze posture
            </button>
          </div>

          {webError && (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-950/20 p-4 text-red-200">
              {webError}
            </div>
          )}

          {webResult && (
            <div className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Score</p>
                  <p className="mt-2 text-4xl font-black text-white">
                    {webResult.score}
                    <span className="text-lg text-slate-400">/100</span>
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Grade</p>
                  <p className="mt-2 text-4xl font-black text-white">{webResult.grade}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 md:col-span-2">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Posture</p>
                  <p className="mt-2 text-lg font-semibold text-white">{webResult.posture}</p>
                  <p className="mt-1 text-sm text-slate-400">{webResult.finalUrl}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <h4 className="font-bold text-white">Reviewer next actions</h4>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {webResult.quickReviewActions.map((action) => (
                    <div key={action} className="flex gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-cyan-300" size={16} />
                      {action}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {webResult.findings.map((finding) => (
                  <div key={finding.check} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-white">{finding.check}</h4>
                        <p className="mt-1 text-sm text-slate-500">Control: {finding.control}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${severityClass(finding.severity)}`}>
                        {finding.severity} · {finding.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{finding.evidence}</p>
                    <p className="mt-2 text-sm text-cyan-100">{finding.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-7">
          <div className="mb-5 flex items-center gap-3">
            <Sparkles className="text-cyan-300" />
            <div>
              <h3 className="text-2xl font-bold text-white">Reviewer plan builder</h3>
              <p className="text-slate-400">Turn scope details into a Copilot-ready review plan.</p>
            </div>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-400">
              Target URL
              <input
                value={plan.targetUrl}
                onChange={(event) => setPlan({ ...plan, targetUrl: event.target.value })}
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-400">
                Application type
                <select
                  value={plan.appType}
                  onChange={(event) => setPlan({ ...plan, appType: event.target.value })}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                >
                  {appTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-400">
                Auth model
                <select
                  value={plan.authModel}
                  onChange={(event) => setPlan({ ...plan, authModel: event.target.value })}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                >
                  {authModels.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_180px]">
              <label className="grid gap-2 text-sm font-semibold text-slate-400">
                Roles / RBAC
                <input
                  value={plan.roles}
                  onChange={(event) => setPlan({ ...plan, roles: event.target.value })}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-400">
                Risk
                <select
                  value={plan.risk}
                  onChange={(event) => setPlan({ ...plan, risk: event.target.value })}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                >
                  {riskLevels.map((risk) => (
                    <option key={risk}>{risk}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-slate-400">
              Scope notes
              <textarea
                value={plan.scopeNotes}
                onChange={(event) => setPlan({ ...plan, scopeNotes: event.target.value })}
                rows={5}
                placeholder="Add target paths, test accounts, restrictions, scan reports, and manual controls to focus on."
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={askCopilot}
              disabled={copilotLoading}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-6 py-3 font-bold text-slate-950 disabled:opacity-60"
            >
              {copilotLoading ? <Loader2 className="animate-spin" size={18} /> : <Bot size={18} />}
              Generate review plan
            </button>
            <button
              onClick={() => copy(promptToCopilot(plan, selectedPrompt), "plan")}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-6 py-3 font-bold text-white hover:bg-slate-800"
            >
              <Clipboard size={18} />
              Copy prompt
            </button>
            {copied === "plan" && <span className="self-center text-sm text-emerald-300">Copied</span>}
          </div>

          {copilotResponse && (
            <div className="mt-5 whitespace-pre-wrap rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-5 text-sm leading-7 text-slate-200">
              {copilotResponse}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-7">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
              <FileText size={18} />
              LLM Prompt Library
            </div>
            <h3 className="text-2xl font-bold text-white">
              Authorized LLM test scenarios for reviewer-led assessments.
            </h3>
            <p className="mt-2 max-w-4xl text-slate-400">
              Payloads are designed for controlled lower-environment testing. Select a scenario, copy the payload,
              and record pass/fail evidence against the expected safe signal.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
            >
              <option>All</option>
              {llmPromptCategories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search payloads..."
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-h-[620px] space-y-3 overflow-y-auto pr-2">
            {filteredPrompts.map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => setSelectedPromptId(prompt.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedPrompt.id === prompt.id
                    ? "border-cyan-400/60 bg-cyan-950/20"
                    : "border-slate-800 bg-slate-950/70 hover:border-slate-600"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">{prompt.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{prompt.category}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${severityClass(prompt.risk)}`}>
                    {prompt.risk}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-slate-400">{prompt.objective}</p>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
                  {selectedPrompt.category}
                </p>
                <h4 className="mt-2 text-2xl font-bold text-white">{selectedPrompt.title}</h4>
                <p className="mt-2 text-slate-400">{selectedPrompt.objective}</p>
              </div>
              <button
                onClick={() => copy(selectedPrompt.payload, selectedPrompt.id)}
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 px-4 py-2 font-semibold text-cyan-200 hover:bg-cyan-400/10"
              >
                <Clipboard size={16} />
                Copy payload
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-800 bg-black/40 p-5 font-mono text-sm leading-7 text-slate-200">
              {selectedPrompt.payload}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="font-bold text-white">Expected safe signal</p>
                <p className="mt-2 text-sm text-slate-400">{selectedPrompt.expectedSignal}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="font-bold text-white">Reviewer notes</p>
                <p className="mt-2 text-sm text-slate-400">{selectedPrompt.reviewerNotes}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {selectedPrompt.controlRefs.map((control) => (
                <span
                  key={control}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-sm font-semibold text-slate-300"
                >
                  Control {control}
                </span>
              ))}
            </div>

            {copied === selectedPrompt.id && (
              <p className="mt-4 text-sm font-semibold text-emerald-300">
                Payload copied to clipboard.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
