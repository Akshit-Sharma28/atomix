"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Download, Presentation, ShieldCheck } from "lucide-react";

const guideSlides = [
  { section: "Reviewer enablement", title: "MCP security reviews need protocol evidence—not chat screenshots", summary: "Review the server independently of the AI interface. Inventory every capability, test direct invocation, and preserve both allowed and denied evidence.", points: ["Understand the exposed capability surface", "Verify server-side identity and scope enforcement", "Connect every conclusion to reproducible JSON-RPC evidence"] },
  { section: "Review objective", title: "Review the server as an execution boundary", summary: "An MCP host is the user-facing AI application, a client manages one server connection, and the server is where capability and authorization controls must be enforced.", points: ["Do not treat the chat UI as the security boundary", "Identify who can invoke which operation against which data", "Test the deployed endpoint with an approved reviewer identity"] },
  { section: "Architecture", title: "Three primitives create three risk surfaces", summary: "Tools execute, resources provide context, and prompts structure user-selected workflows. Each needs a different review lens.", points: ["Tools: schema, authorization, approval, audit, rollback", "Resources: URI scope, classification, tenant isolation", "Prompts: arguments, embedded instructions, injection resistance", "Client features: roots, sampling, and elicitation consent"] },
  { section: "Lifecycle", title: "Initialize before trusting discovery", summary: "MCP uses JSON-RPC 2.0 and negotiates capabilities during initialization. Stateful HTTP servers can require a session identifier on every later request.", code: '{\n  "jsonrpc": "2.0",\n  "id": 1,\n  "method": "initialize",\n  "params": { "protocolVersion": "2025-06-18", "capabilities": {} }\n}', points: ["Match responses to request IDs", "Expect either result or error", "Preserve Mcp-Session-Id when returned", "Complete the initialized lifecycle in a stateful client"] },
  { section: "Discovery", title: "Inventory first; execution comes later", summary: "Discovery reveals the attack surface without calling business actions.", points: ["initialize — negotiate protocol and capabilities", "tools/list — review names, descriptions, and schemas", "resources/list — review URIs and data scope", "prompts/list — review templates and arguments", "ping — confirms reachability only"] },
  { section: "Schema review", title: "A tool schema is part of the security contract", summary: "Treat each tool as an externally reachable API operation influenced by a model or potentially malicious client.", points: ["Require typed, bounded, allowlisted inputs", "Test URL, host, path, query, command, and identifier fields", "Re-check actor, tenant, project, and record scope server-side", "Identify write/destructive behavior even when the name is vague"] },
  { section: "Controlled invocation", title: "Test read-only calls before state-changing actions", summary: "Use an approved test identity and arguments derived from tools/list. Never improvise write-tool testing.", code: '{\n  "jsonrpc": "2.0",\n  "id": 3,\n  "method": "tools/call",\n  "params": {\n    "name": "example.read_only_tool",\n    "arguments": { "query": "approved test value" }\n  }\n}', points: ["Record endpoint, role, request, response, latency, and audit event", "Require confirmation, idempotency, and rollback for write tools"] },
  { section: "Abuse tests", title: "Negative tests prove the boundary", summary: "A successful happy path proves functionality, not control effectiveness.", points: ["Direct invocation outside the intended agent flow", "Cross-project, cross-user, and cross-tenant identifiers", "Indirect prompt injection from resources and tool output", "Secret leakage through responses, logs, prompts, or exports", "SSRF, internal hosts, file URLs, replay, and unsafe sequencing"] },
  { section: "Evidence", title: "Evidence must connect request, decision, and enforcement", summary: "Another reviewer should be able to reproduce the conclusion without access to your memory or chat transcript.", points: ["Positive: allowed actor, scoped request, result, audit record", "Negative: prohibited actor/scope, denial, server log", "Sanitize token values but retain identity context", "Attach Atomix discovery export and selected JSON-RPC transcripts", "Document owner, due date, retest criteria, and residual risk"] },
  { section: "Sign-off", title: "Close only when capability, control, and evidence align", summary: "Approval is supportable when the inventory matches deployment and every sensitive path has enforceable controls and reproducible evidence.", points: ["Authentication and authorization enforced server-side", "Write tools protected by human-control safeguards", "Data and logs follow classification rules", "Transport and session handling verified", "Findings carry owners, dates, and retest criteria"] },
];

export default function McpReviewerGuide() {
  const [index, setIndex] = useState(0);
  const slide = guideSlides[index];
  return (
    <section className="mb-6 rounded-3xl border border-violet-400/20 bg-violet-400/[0.04] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Interactive reviewer guide</p><h2 className="mt-1 text-xl font-bold text-white">MCP Security Review — presentation flow</h2><p className="mt-2 text-sm text-slate-400">View the guide here or download the complete PowerPoint for training and review walkthroughs.</p></div>
        <a href="/downloads/mcp-reviewer-guide.pptx" download className="inline-flex items-center gap-2 rounded-xl bg-violet-400 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-violet-300"><Download size={16} />Download reviewer guide</a>
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-[220px_1fr]">
        <nav className="hidden max-h-[31rem] space-y-1 overflow-y-auto xl:block" aria-label="Guide chapters">
          {guideSlides.map((item, itemIndex) => <button key={item.title} type="button" onClick={() => setIndex(itemIndex)} className={`w-full rounded-xl px-3 py-2.5 text-left text-xs transition ${itemIndex === index ? "bg-violet-400 text-slate-950" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}><span className="mr-2 font-bold">{String(itemIndex + 1).padStart(2, "0")}</span>{item.section}</button>)}
        </nav>
        <article className="min-h-[31rem] rounded-2xl border border-slate-800 bg-[#050b19] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">{String(index + 1).padStart(2, "0")} · {slide.section}</p><Presentation size={18} className="text-violet-300" /></div>
          <h3 className="mt-5 max-w-4xl text-2xl font-black leading-tight text-white sm:text-3xl">{slide.title}</h3>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300">{slide.summary}</p>
          <div className={`mt-6 grid gap-5 ${slide.code ? "lg:grid-cols-2" : ""}`}>
            {slide.code && <pre className="overflow-x-auto rounded-2xl border border-slate-800 bg-black/50 p-4 text-xs leading-6 text-cyan-100"><code>{slide.code}</code></pre>}
            <ul className="space-y-3">{slide.points.map((point) => <li key={point} className="flex gap-3 text-sm leading-6 text-slate-300"><ShieldCheck className="mt-1 shrink-0 text-violet-300" size={15} /><span>{point}</span></li>)}</ul>
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-4">
            <button type="button" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))} className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 disabled:opacity-30"><ArrowLeft size={16} />Previous</button>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-violet-400 transition-all" style={{ width: `${((index + 1) / guideSlides.length) * 100}%` }} /></div>
            <button type="button" disabled={index === guideSlides.length - 1} onClick={() => setIndex((value) => Math.min(guideSlides.length - 1, value + 1))} className="inline-flex items-center gap-2 text-sm font-bold text-cyan-200 disabled:opacity-30">Next<ArrowRight size={16} /></button>
          </div>
        </article>
      </div>
    </section>
  );
}
