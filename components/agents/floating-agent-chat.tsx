"use client";

import {
  Bot,
  Loader2,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import LocalAiStatus from "@/components/ui/local-ai-status";
import {
  getServerPetPreference,
  readPetPreference,
  subscribeToPetPreference,
} from "@/components/pet/pet-preference";

const quickPrompts = [
  "Summarize today's governance actions and owners.",
  "Draft a weekly call email with attendance, extensions, and red engagements.",
  "Recommend Dedicated vs Augmentation reviewer assignments.",
  "Find SLA pressure, overdue SRs, and escalation candidates.",
];

type AgentTraceStep = {
  step?: number;
  toolName?: string;
  elapsedMs?: number;
  summary?: string;
};

function formatTrace(trace: AgentTraceStep[]) {
  if (trace.length === 0) {
    return "";
  }

  return `\n\nAgent trace:\n${trace
    .map(
      (step, index) =>
        `- Step ${step.step ?? index + 1}: ${step.toolName ?? "tool"}${typeof step.elapsedMs === "number" ? ` (${step.elapsedMs}ms)` : ""} - ${step.summary ?? "Completed"}`,
    )
    .join("\n")}`;
}

export default function FloatingAgentChat() {
  const petEnabled = useSyncExternalStore(
    subscribeToPetPreference,
    readPetPreference,
    getServerPetPreference,
  );
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<
    {
      role: "user" | "agent";
      text: string;
    }[]
  >([
    {
      role: "agent",
      text: "Hi, I’m Atomix Agent. I can help with governance workflow, reviewer pools, SLA pressure, FEAD evidence, interview flow, and executive updates.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const panelSize = expanded
    ? "h-[min(82vh,760px)] w-[min(760px,calc(100vw-2rem))]"
    : "h-[min(640px,calc(100vh-7rem))] w-[min(460px,calc(100vw-2rem))]";

  useEffect(() => {
    const openAgent = () => setOpen(true);
    window.addEventListener("atomix:open-agent", openAgent);
    return () => window.removeEventListener("atomix:open-agent", openAgent);
  }, []);

  async function ask(prompt = question) {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || loading) {
      return;
    }

    setQuestion("");
    setMessages((current) => [
      ...current,
      {
        role: "user",
        text: trimmedPrompt,
      },
    ]);
    setLoading(true);

    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: `Act as Atomix Agent for agentic pentest workflow. Use dashboard context if available. User request: ${trimmedPrompt}`,
        }),
      });

      const data = await response.json();
      const trace = Array.isArray(data.agentTrace)
        ? formatTrace(data.agentTrace)
        : "";
      const mode =
        typeof data.mode === "string"
          ? `\n\nMode: ${data.mode}`
          : "";

      setMessages((current) => [
        ...current,
        {
          role: "agent",
          text:
            data.answer
              ? `${data.answer}${trace}${mode}`
              : data.error ??
                "I could not produce an answer from the local AI service.",
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "agent",
          text: "Unable to contact Atomix Agent right now. Check the AI service status and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[80]">
      {open && (
        <div
          className={`mb-4 overflow-hidden rounded-3xl border border-cyan-400/30 bg-slate-950/95 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl transition-all ${
            panelSize
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-800 bg-cyan-400/[0.04] p-4">
            <div className="flex items-center gap-3">
              <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-cyan-400 text-slate-950">
                <Bot size={22} />
              </div>
              <div>
                <p className="font-bold text-white">
                  Atomix Agent
                </p>
                <p className="text-xs text-cyan-200">
                  Workflow-aware governance copilot
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label={expanded ? "Minimize chat" : "Expand chat"}
              >
                {expanded ? (
                  <Minimize2 size={16} />
                ) : (
                  <Maximize2 size={16} />
                )}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex h-[calc(100%-73px)] flex-col">
            <div className="border-b border-slate-800 p-3">
              <div className="mb-3">
                <LocalAiStatus compact />
              </div>
              <div className={`grid gap-2 ${expanded ? "md:grid-cols-2" : ""}`}>
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => ask(prompt)}
                    className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-100"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[86%] whitespace-pre-wrap rounded-2xl bg-cyan-400 px-4 py-3 text-sm text-slate-950"
                      : "mr-auto max-w-[92%] whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm leading-6 text-slate-200"
                  }
                >
                  {message.text}
                </div>
              ))}
              {loading && (
                <div className="mr-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-200">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="animate-spin" size={15} />
                    Atomix Agent is thinking…
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 p-3">
              <div className="flex items-end gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-2">
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      ask();
                    }
                  }}
                  rows={2}
                  placeholder="Ask about assignments, leadership risk, workflow, or reviewers..."
                  className="min-h-12 flex-1 resize-none bg-transparent px-2 py-1 text-sm text-white outline-none placeholder:text-slate-500"
                />
                <button
                  onClick={() => ask()}
                  disabled={loading || !question.trim()}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400 text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send message"
                >
                  {loading ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!petEnabled && <button
        onClick={() => setOpen(!open)}
        className="group relative grid h-16 w-16 place-items-center rounded-3xl border border-cyan-300/40 bg-slate-950 text-cyan-200 shadow-2xl shadow-cyan-950/40 transition hover:-translate-y-1 hover:border-cyan-200"
        aria-label="Open Atomix Agent chat"
      >
        <span className="absolute inset-0 animate-ping rounded-3xl bg-cyan-400/10" />
        <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-cyan-400 text-[10px] font-black text-slate-950">
          AI
        </span>
        <Sparkles
          size={26}
          className="relative transition group-hover:rotate-12"
        />
      </button>}
    </div>
  );
}
