import { askCopilot } from "@/services/ai/openai.service";
import {
  callMcpTool,
  type McpToolCallResult,
} from "@/services/agents/mcp-client.service";

export type AgentTraceStep = {
  step: number;
  toolName: string;
  arguments: Record<string, unknown>;
  elapsedMs: number;
  status: "completed" | "failed";
  summary: string;
};

type PlannedToolCall = {
  toolName: string;
  arguments: Record<string, unknown>;
  reason: string;
};

type AgentRunOptions = {
  maxToolCalls?: number;
  timeoutMs?: number;
  numPredict?: number;
};

const defaultMaxToolCalls = 3;
const maxObservationCharacters = 12000;

function normalizeQuestion(question: string) {
  return question.toLowerCase();
}

function extractLimit(question: string) {
  const match = question.match(/\b(?:top|limit|first)\s+(\d{1,2})\b/i);
  const parsed = match ? Number(match[1]) : 10;

  return Math.max(1, Math.min(Number.isFinite(parsed) ? parsed : 10, 25));
}

function extractSeverity(question: string) {
  const match = question.match(/\b(critical|high|medium|low|info)\b/i);

  if (!match) {
    return undefined;
  }

  return match[1][0].toUpperCase() + match[1].slice(1).toLowerCase();
}

function extractSprOrSr(question: string) {
  const match = question.match(/\b(?:SPR|SR)-[A-Z0-9-]+\b/i);

  return match?.[0].toUpperCase();
}

function planMcpToolCalls(question: string): PlannedToolCall[] {
  const normalized = normalizeQuestion(question);
  const limit = extractLimit(question);
  const severity = extractSeverity(question);
  const idOrRecord = extractSprOrSr(question);
  const calls: PlannedToolCall[] = [];

  if (
    normalized.includes("dashboard") ||
    normalized.includes("governance") ||
    normalized.includes("summary") ||
    normalized.includes("sla") ||
    normalized.includes("overdue") ||
    normalized.includes("extension") ||
    normalized.includes("red")
  ) {
    calls.push({
      toolName: "atomix.dashboard_summary",
      arguments: {},
      reason: "Collect live governance counters before drafting the answer.",
    });
  }

  if (
    idOrRecord?.startsWith("SPR-") ||
    normalized.includes("project") ||
    normalized.includes("portfolio")
  ) {
    calls.push({
      toolName: idOrRecord?.startsWith("SPR-")
        ? "atomix.get_project"
        : "atomix.search_projects",
      arguments: idOrRecord?.startsWith("SPR-")
        ? { idOrSpr: idOrRecord }
        : { query: "", limit },
      reason: "Ground the agent in live project context.",
    });
  }

  if (
    idOrRecord?.startsWith("SR-") ||
    normalized.includes("review") ||
    normalized.includes("assignment") ||
    normalized.includes("reviewer")
  ) {
    calls.push({
      toolName: idOrRecord?.startsWith("SR-")
        ? "atomix.get_review"
        : "atomix.list_reviews",
      arguments: idOrRecord?.startsWith("SR-")
        ? { idOrSr: idOrRecord }
        : { limit },
      reason: "Inspect active security review context and ownership signals.",
    });
  }

  if (
    normalized.includes("finding") ||
    normalized.includes("vulnerab") ||
    normalized.includes("critical") ||
    normalized.includes("high") ||
    normalized.includes("risk")
  ) {
    calls.push({
      toolName: "atomix.list_findings",
      arguments: {
        ...(severity ? { severity } : {}),
        limit,
      },
      reason: "Fetch current finding signals instead of relying on stale prompt context.",
    });
  }

  if (
    normalized.includes("mcp") ||
    normalized.includes("tool") ||
    normalized.includes("agentic") ||
    normalized.includes("prompt") ||
    normalized.includes("llm")
  ) {
    calls.push({
      toolName: "atomix.get_mcp_controls",
      arguments: {},
      reason: "Use the MCP control library for agentic security guidance.",
    });
  }

  if (calls.length === 0) {
    calls.push({
      toolName: "atomix.dashboard_summary",
      arguments: {},
      reason: "Start with a compact live Atomix summary.",
    });
  }

  return calls;
}

function summarizeObservation(result: McpToolCallResult) {
  const parsed = parseJson(result.resultText);

  if (Array.isArray(parsed)) {
    return `${result.toolName} returned ${parsed.length} records.`;
  }

  if (parsed && typeof parsed === "object") {
    const keys = Object.keys(parsed).slice(0, 6);

    return `${result.toolName} returned fields: ${keys.join(", ") || "none"}.`;
  }

  return `${result.toolName} returned ${result.resultText.length} characters.`;
}

function parseJson(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function truncateObservation(text: string) {
  if (text.length <= maxObservationCharacters) {
    return text;
  }

  return `${text.slice(0, maxObservationCharacters)}\n\n[Observation truncated ${text.length - maxObservationCharacters} characters]`;
}

function traceMarkdown(trace: AgentTraceStep[]) {
  return trace
    .map(
      (step) =>
        `- Step ${step.step}: ${step.status === "completed" ? "called" : "failed"} ${step.toolName} in ${step.elapsedMs}ms. ${step.summary}`,
    )
    .join("\n");
}

export async function runMcpAugmentedAgent(
  question: string,
  baseContext: string,
  options: AgentRunOptions = {},
) {
  const maxToolCalls = options.maxToolCalls ?? defaultMaxToolCalls;
  const plannedCalls = planMcpToolCalls(question).slice(0, maxToolCalls);
  const trace: AgentTraceStep[] = [];
  const observations: string[] = [];

  for (const [index, plannedCall] of plannedCalls.entries()) {
    try {
      const result = await callMcpTool(
        plannedCall.toolName,
        plannedCall.arguments,
      );
      const summary = `${plannedCall.reason} ${summarizeObservation(result)}`;

      trace.push({
        step: index + 1,
        toolName: result.toolName,
        arguments: result.arguments,
        elapsedMs: result.elapsedMs,
        status: "completed",
        summary,
      });
      observations.push(
        `Tool: ${result.toolName}\nReason: ${plannedCall.reason}\nArguments: ${JSON.stringify(result.arguments)}\nObservation:\n${truncateObservation(result.resultText)}`,
      );
    } catch (error) {
      trace.push({
        step: index + 1,
        toolName: plannedCall.toolName,
        arguments: plannedCall.arguments,
        elapsedMs: 0,
        status: "failed",
        summary:
          error instanceof Error ? error.message : "MCP tool call failed.",
      });
    }
  }

  const context = `
Base Atomix context:
${baseContext}

MCP observations:
${observations.join("\n\n---\n\n") || "No MCP observations were available."}

Agent trace:
${traceMarkdown(trace)}
`;

  const answer = await askCopilot(
    `Use the MCP observations as live tool evidence. Answer the user request with concrete next actions, call out uncertainty, and do not claim to change records.\n\nUser request:\n${question}`,
    context,
    {
      timeoutMs: options.timeoutMs ?? 45000,
      numPredict: options.numPredict ?? 900,
      think: false,
    },
  );

  return {
    answer,
    trace,
    plannedToolCount: plannedCalls.length,
  };
}
