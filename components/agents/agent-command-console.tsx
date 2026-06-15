"use client";

import { Bot, Loader2, Terminal } from "lucide-react";
import { useState } from "react";

const examples = [
  {
    label: "Create Project",
    command: {
      command: "create_project",
      data: {
        name: "New Customer Portal",
        client: "Retail Banking",
        sprId: "SPR-0100",
        riskTier: "High",
      },
    },
  },
  {
    label: "Create SR",
    command: {
      command: "create_sr",
      data: {
        projectId: "paste-project-id",
        title: "External Web App Review",
        type: "WEB",
        priority: "High",
        dueDate: "2026-07-01",
      },
    },
  },
  {
    label: "Create Finding",
    command: {
      command: "create_finding",
      data: {
        projectId: "paste-project-id",
        title: "Missing HSTS Header",
        severity: "Medium",
        description: "HSTS header is not present.",
      },
    },
  },
];

export default function AgentCommandConsole() {
  const [command, setCommand] = useState(
    JSON.stringify(examples[0].command, null, 2),
  );
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setResult("");

    try {
      const parsed = JSON.parse(command);
      const response = await fetch("/api/agent/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(
        error instanceof Error
          ? error.message
          : "Invalid command",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-6">
      <div className="mb-5 flex items-start gap-3">
        <Bot className="text-cyan-300" size={24} />
        <div>
          <h2 className="text-xl font-bold text-white">
            Agent Command Center
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Admin/Governance-only command surface. The AI agent can create
            users, projects/SPRs, SRs, and findings when a human submits a
            structured command.
          </p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example.label}
            onClick={() =>
              setCommand(JSON.stringify(example.command, null, 2))
            }
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-cyan-400/40"
          >
            {example.label}
          </button>
        ))}
      </div>

      <textarea
        value={command}
        onChange={(event) => setCommand(event.target.value)}
        rows={10}
        className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-sm text-slate-200"
      />

      <button
        onClick={run}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950"
      >
        {loading ? <Loader2 className="animate-spin" size={16} /> : <Terminal size={16} />}
        Run Agent Command
      </button>

      {result && (
        <pre className="mt-5 max-h-80 overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 whitespace-pre-wrap text-sm text-slate-200">
          {result}
        </pre>
      )}
    </section>
  );
}
