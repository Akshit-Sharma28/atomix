import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Braces,
  CheckCircle2,
  Database,
  KeyRound,
  Network,
  ShieldAlert,
  Terminal,
  Wrench,
} from "lucide-react";

import { canAccess } from "@/services/users/access.service";
import McpReviewerGuide from "@/components/agents/mcp-reviewer-guide";

const initializeRequest = `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": {},
    "clientInfo": {
      "name": "Atomix MCP Review Agent",
      "version": "1.0.0"
    }
  }
}`;

const toolsListRequest = `{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}`;

const toolCallRequest = `{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "example.read_only_tool",
    "arguments": {
      "query": "approved test value"
    }
  }
}`;

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-2xl border border-slate-800 bg-black/50 p-4 text-xs leading-6 text-cyan-100">
      <code>{children}</code>
    </pre>
  );
}

export default async function McpTutorialPage() {
  const allowed = await canAccess([
    "ADMIN",
    "GOVERNANCE_TEAM",
    "VALIDATOR",
    "QA_REVIEWER",
    "REVIEWER",
  ]);

  if (!allowed) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6 text-red-200">
          MCP tutorial access is restricted to MCP Review Agent users.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-6 border-b border-slate-800 pb-5">
        <Link href="/workflow/mcp-review" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200">
          <ArrowLeft size={16} /> Back to MCP Review Agent
        </Link>
        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
          <BookOpen size={16} /> Learning Center
        </div>
        <h1 className="text-3xl font-bold text-white">MCP and JSON-RPC: Reviewer Tutorial</h1>
        <p className="mt-2 max-w-4xl text-slate-400">
          A practical introduction for reviewers who need to discover an MCP server,
          understand its exposed capabilities, make controlled JSON-RPC requests,
          and capture defensible security evidence.
        </p>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        {[
          ["1", "Understand", "MCP actors and primitives"],
          ["2", "Discover", "Initialize and list capabilities"],
          ["3", "Test", "Controlled JSON-RPC calls"],
          ["4", "Evidence", "Record risks and results"],
        ].map(([step, title, detail]) => (
          <div key={step} className="rounded-2xl border border-cyan-500/15 bg-slate-900/70 p-4">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan-400 text-sm font-black text-slate-950">{step}</span>
            <p className="mt-3 font-bold text-white">{title}</p>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
          </div>
        ))}
      </div>

      <McpReviewerGuide />

      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3"><Network className="text-cyan-300" /><h2 className="text-xl font-bold text-white">1. What MCP is</h2></div>
          <p className="mt-3 max-w-5xl text-sm leading-7 text-slate-300">
            Model Context Protocol is a client-server standard that lets an AI host connect
            to external capabilities. The host is the application a user interacts with;
            an MCP client maintains a connection to one MCP server; and the server exposes
            capabilities through a JSON-RPC-based data layer.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              [Wrench, "Tools", "Executable functions. They may read data or perform actions, so authorization and confirmation matter."],
              [Database, "Resources", "Application-controlled context such as documents, schemas, records, or API responses."],
              [BookOpen, "Prompts", "User-selected reusable templates that guide a repeatable interaction or workflow."],
            ].map(([Icon, title, description]) => {
              const ItemIcon = Icon as typeof Wrench;
              return <div key={title as string} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"><ItemIcon className="text-violet-300" size={20} /><h3 className="mt-3 font-bold text-white">{title as string}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{description as string}</p></div>;
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3"><Braces className="text-cyan-300" /><h2 className="text-xl font-bold text-white">2. JSON-RPC essentials</h2></div>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            MCP requests use JSON-RPC 2.0. A request contains <code className="text-cyan-200">jsonrpc</code>, a unique <code className="text-cyan-200">id</code>, a protocol <code className="text-cyan-200">method</code>, and usually a <code className="text-cyan-200">params</code> object. The matching response uses the same ID and contains either <code className="text-cyan-200">result</code> or <code className="text-cyan-200">error</code>.
          </p>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div><h3 className="font-bold text-white">Initialize the connection</h3><CodeBlock>{initializeRequest}</CodeBlock></div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-4 text-sm leading-6 text-slate-300">
              <p className="font-bold text-amber-200">Lifecycle note</p>
              <p className="mt-2">A full client follows a successful initialize response with an initialized notification. Streamable HTTP servers can also return an MCP session ID that must be included on later requests. A standalone inspector probe may fail when a server strictly requires that stateful lifecycle.</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3"><Terminal className="text-cyan-300" /><h2 className="text-xl font-bold text-white">3. Discovery before execution</h2></div>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Discovery asks what a server exposes before anything is executed. In Atomix,
            open the Discovery tab, enter the Streamable HTTP endpoint and authorized test
            credential, then run the scan. It checks initialize, tool/resource/prompt lists,
            and ping, and produces an exportable evidence trail.
          </p>
          <CodeBlock>{toolsListRequest}</CodeBlock>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["tools/list", "Review names, descriptions, input schemas, and write/destructive potential."],
              ["resources/list", "Check URI scope, sensitive content, tenant separation, and read authorization."],
              ["prompts/list", "Check template purpose, arguments, embedded instructions, and injection exposure."],
              ["ping", "Confirms basic reachability; it does not prove authorization or security."],
            ].map(([method, detail]) => <div key={method} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><p className="font-mono text-xs font-bold text-cyan-200">{method}</p><p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p></div>)}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3"><ShieldAlert className="text-amber-300" /><h2 className="text-xl font-bold text-white">4. Make a controlled tool call</h2></div>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Use the Inspector only with an authorized test account. Start with read-only tools,
            use the schema returned by tools/list, and never test create, update, delete, send,
            execute, or export operations without explicit approval and a rollback plan.
          </p>
          <CodeBlock>{toolCallRequest}</CodeBlock>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4"><p className="flex items-center gap-2 font-bold text-emerald-200"><CheckCircle2 size={16} />Capture for every positive test</p><p className="mt-2 text-sm leading-6 text-slate-400">Role, endpoint, method, tool name, sanitized arguments, response status, elapsed time, scoped records returned, and audit record.</p></div>
            <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-4"><p className="flex items-center gap-2 font-bold text-red-200"><KeyRound size={16} />Capture for every negative test</p><p className="mt-2 text-sm leading-6 text-slate-400">Expected denial, actual response, cross-project or cross-tenant attempt, token redaction, server-side denial evidence, and residual risk.</p></div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-xl font-bold text-white">5. Transport and troubleshooting</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500"><tr className="border-b border-slate-800"><th className="py-3 pr-4">Symptom</th><th className="py-3 pr-4">Likely cause</th><th className="py-3">Reviewer action</th></tr></thead>
              <tbody className="text-slate-300">
                {[
                  ["401 / 403", "Missing, expired, or under-privileged credential", "Confirm the approved test identity and server-side authorization policy."],
                  ["404 / 405", "Wrong endpoint or legacy HTTP+SSE endpoint", "Confirm the server's MCP endpoint and supported transport."],
                  ["400 after initialize", "Required MCP session ID or lifecycle step is missing", "Use a stateful MCP client/Inspector and capture the returned session header."],
                  ["Timeout", "Network control, streaming response, or slow tool", "Check reachability and server logs; do not repeatedly invoke write tools."],
                  ["Method not found", "Capability is not implemented or was not advertised", "Return to discovery and compare the server capability declaration."],
                ].map(([symptom, cause, action]) => <tr key={symptom} className="border-b border-slate-800/70"><td className="py-3 pr-4 font-semibold text-white">{symptom}</td><td className="py-3 pr-4">{cause}</td><td className="py-3">{action}</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.05] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><h2 className="text-xl font-bold text-white">Ready to try it?</h2><p className="mt-2 text-sm text-slate-400">Start with Discovery, review schemas, then move to a read-only Inspector call.</p></div>
            <Link href="/workflow/mcp-review" className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300">Open MCP Review Agent <ArrowRight size={16} /></Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <a className="text-cyan-300 hover:text-cyan-200" href="https://modelcontextprotocol.io/docs/getting-started/intro" target="_blank" rel="noreferrer">Official MCP introduction</a>
            <a className="text-cyan-300 hover:text-cyan-200" href="https://modelcontextprotocol.io/docs/learn/architecture" target="_blank" rel="noreferrer">Official architecture guide</a>
            <a className="text-cyan-300 hover:text-cyan-200" href="https://modelcontextprotocol.io/specification/2025-06-18/basic/transports" target="_blank" rel="noreferrer">Transport specification</a>
          </div>
        </section>
      </div>
    </div>
  );
}
