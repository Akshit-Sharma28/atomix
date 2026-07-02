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
    normalized.includes("red") ||
    normalized.includes("allocation") ||
    normalized.includes("assignment") ||
    normalized.includes("reviewer")
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
    normalized.includes("reviewer") ||
    normalized.includes("overdue") ||
    normalized.includes("sla") ||
    normalized.includes("governance action")
  ) {
    calls.push({
      toolName: idOrRecord?.startsWith("SR-")
        ? "atomix.get_review"
        : "atomix.list_reviews",
      arguments: idOrRecord?.startsWith("SR-")
        ? { idOrSr: idOrRecord }
        : {
            limit: Math.min(limit, 8),
            ...(normalized.includes("overdue") || normalized.includes("sla")
              ? { overdue: true }
              : {}),
          },
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

function observationHeadline(observation: string) {
  const tool = observation.match(/^Tool: (.+)$/m)?.[1] ?? "MCP tool";
  const parsed = parseJson(observation.split("Observation:\n")[1] ?? "");

  if (Array.isArray(parsed)) {
    return `${tool}: ${parsed.length} records available for review.`;
  }

  if (parsed && typeof parsed === "object") {
    const values = Object.entries(parsed)
      .slice(0, 6)
      .map(([key, value]) => `${key}: ${String(value).slice(0, 80)}`);

    return `${tool}: ${values.join("; ")}`;
  }

  return `${tool}: observation captured.`;
}

function deterministicAnswer(
  question: string,
  observations: string[],
  trace: AgentTraceStep[],
  synthesisError: unknown,
) {
  const completed = trace.filter((step) => step.status === "completed");
  const failed = trace.filter((step) => step.status === "failed");
  const errorMessage =
    synthesisError instanceof Error
      ? synthesisError.message
      : "LLM synthesis was unavailable.";
  const synthesis = buildGroundedSynthesis(question, observations, trace);

  return `${synthesis}

### Agent Trace
${traceMarkdown(trace) || "- No tool calls were attempted."}

### Synthesis Status
- MCP tools completed and returned live data.
- Deterministic answer used because local LLM synthesis timed out or was unavailable: ${errorMessage}
- Completed MCP calls: ${completed.length}
- Failed MCP calls: ${failed.length}`;
}

function parseObservation(observation: string) {
  const toolName = observation.match(/^Tool: (.+)$/m)?.[1] ?? "MCP tool";
  const raw = observation.split("Observation:\n")[1] ?? "";

  return {
    toolName,
    data: parseJson(raw),
  };
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function stringField(record: Record<string, unknown> | null, key: string) {
  const value = record?.[key];

  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberField(record: Record<string, unknown> | null, key: string) {
  const value = record?.[key];

  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function nestedRecord(record: Record<string, unknown> | null, key: string) {
  return asRecord(record?.[key]);
}

function findingLine(value: unknown) {
  const finding = asRecord(value);
  const project = nestedRecord(finding, "project");
  const review = nestedRecord(finding, "review");
  const owner = nestedRecord(finding, "owner");

  return `- ${stringField(finding, "severity") ?? "Unknown"}: ${stringField(finding, "title") ?? "Untitled finding"} (${stringField(project, "sprId") ?? stringField(project, "name") ?? "No SPR"} / ${stringField(review, "srId") ?? stringField(review, "title") ?? "No SR"}) — status: ${stringField(finding, "status") ?? "Unknown"}, owner: ${stringField(owner, "name") ?? "Unassigned"}.`;
}

function reviewLine(value: unknown) {
  const review = asRecord(value);
  const project = nestedRecord(review, "project");
  const assignments = asArray(review?.assignments);
  const dueDate = stringField(review, "dueDate");
  const dueLabel = dueDate
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(dueDate))
    : "No due date";

  return `- ${stringField(review, "srId") ?? "SR pending"} (${stringField(project, "sprId") ?? stringField(project, "name") ?? "No SPR"}) — ${stringField(review, "title") ?? "Untitled review"}, status: ${stringField(review, "status") ?? "Unknown"}, due: ${dueLabel}, assignments: ${assignments.length}.`;
}

function isOverdueReview(value: unknown) {
  const review = asRecord(value);
  const dueDate = stringField(review, "dueDate");
  const status = stringField(review, "status") ?? "";

  return Boolean(
    dueDate &&
      new Date(dueDate).getTime() < Date.now() &&
      !["Completed", "Closed", "Cancelled"].includes(status),
  );
}

function isMcpExplainerQuestion(question: string) {
  const normalized = normalizeQuestion(question);

  return (
    normalized.includes("what is mcp") ||
    normalized.includes("mcp security") ||
    normalized.includes("explain mcp") ||
    normalized.includes("model context protocol")
  );
}

function mcpExplainerAnswer(question: string, observations: string[], trace: AgentTraceStep[]) {
  const parsed = observations.map(parseObservation);
  const controls = asRecord(
    parsed.find((item) => item.toolName === "atomix.get_mcp_controls")?.data,
  );
  const controlCount = numberField(controls, "count") ?? 10;

  return `## Atomix Agent Result

MCP responded successfully. Here is the MCP security explanation in plain language.

### Request
${question}

### Answer
MCP Security means securing the Model Context Protocol layer that lets an AI agent discover tools, read resources, retrieve prompts, and call actions in connected systems. In Atomix, MCP is what allows the Copilot to move from a prompt-only assistant to a tool-using agent that can inspect live reviews, findings, evidence, and governance signals.

### Why It Matters
- MCP gives agents real capabilities, so the security risk moves from only “bad prompt output” to “bad tool action, data access, or workflow decision.”
- The main risks are excessive tool permissions, direct tool invocation, prompt injection through resources/tool output, secret leakage, SSRF/network abuse, destructive actions, and weak audit logging.
- MCP security is especially important when tools can read confidential review evidence, assign owners, create retest requests, export documents, or query internal systems.

### Atomix MCP Controls
- Atomix currently tracks ${controlCount} MCP security controls for Streamable HTTP, STDIO, resources, prompts, auth, token handling, sampling, elicitation, tool abuse, and evidence capture.
- The MCP Review Agent can test endpoints, capture JSON-RPC evidence, generate FEAD-style review packs, and expose a prompt library for MCP abuse cases.

### Recommended Next Actions
- Inventory tools, resources, prompts, roots, sampling, and elicitation before enabling an agent.
- Enforce RBAC and project/SR scoping on every tool call, not just in the UI.
- Keep destructive/write actions human-approved with audit logs and rollback notes.
- Treat MCP tool outputs and resources as untrusted input; sanitize them before LLM synthesis.
- Store MCP probe results and review evidence in the Document Vault/Data Lake for auditability.

### Live MCP Observations
${observations.length > 0
  ? observations.map((observation) => `- ${observationHeadline(observation)}`).join("\n")
  : "- No live MCP observations were returned."}

### Tool Coverage
- Planned MCP calls: ${trace.length}
- Successful MCP calls: ${trace.filter((step) => step.status === "completed").length}
- Failed MCP calls: ${trace.filter((step) => step.status === "failed").length}`;
}

function buildGroundedSynthesis(
  question: string,
  observations: string[],
  trace: AgentTraceStep[],
) {
  if (isMcpExplainerQuestion(question)) {
    return mcpExplainerAnswer(question, observations, trace);
  }

  const parsed = observations.map(parseObservation);
  const dashboard = asRecord(
    parsed.find((item) => item.toolName === "atomix.dashboard_summary")?.data,
  );
  const findings = asArray(
    parsed.find((item) => item.toolName === "atomix.list_findings")?.data,
  );
  const reviews = asArray(
    parsed.find((item) => item.toolName === "atomix.list_reviews")?.data,
  );
  const overdueReviews = reviews.filter(isOverdueReview);
  const criticalFindings = findings.filter(
    (finding) => stringField(asRecord(finding), "severity") === "Critical",
  );
  const highSignalFindings =
    criticalFindings.length > 0
      ? criticalFindings
      : findings.filter((finding) =>
          ["High", "Critical"].includes(stringField(asRecord(finding), "severity") ?? ""),
        );

  return `## Atomix Agent Result

MCP responded successfully. This answer is grounded in live Atomix tool data.

### Request
${question}

### Executive Signal
- Projects in scope: ${numberField(dashboard, "projectCount") ?? "not returned"}.
- Active reviews: ${numberField(dashboard, "activeReviewCount") ?? "not returned"} of ${numberField(dashboard, "reviewCount") ?? "not returned"} total.
- Overdue reviews: ${numberField(dashboard, "overdueReviewCount") ?? overdueReviews.length}.
- Findings: ${numberField(dashboard, "findingCount") ?? findings.length} total, ${numberField(dashboard, "openFindingCount") ?? "unknown"} open, ${numberField(dashboard, "criticalOpenCount") ?? criticalFindings.length} critical open.

### Critical Risks
${highSignalFindings.length > 0
  ? highSignalFindings.slice(0, 5).map(findingLine).join("\n")
  : "- No critical/high finding records were returned by the MCP finding query."}

### Overdue Governance Actions
${overdueReviews.length > 0
  ? overdueReviews.slice(0, 5).map(reviewLine).join("\n")
  : reviews.length > 0
    ? reviews.slice(0, 5).map(reviewLine).join("\n")
    : "- MCP returned overdue counters, but no review detail query was available in this run."}

### Recommended Next Actions
- Triage critical/high findings first: confirm owner, SR linkage, fix readiness, and target retest date.
- For overdue reviews, assign a named accountable reviewer or governance owner before the next call.
- Move fixed items into Retest Governance; leave unresolved items with an explicit remediation, exception, or escalation path.
- Use the MCP Review Agent inspector if you need raw JSON evidence for audit or demo proof.

### Live MCP Observations
${observations.length > 0
  ? observations.map((observation) => `- ${observationHeadline(observation)}`).join("\n")
  : "- No live MCP observations were returned."}

### Tool Coverage
- Planned MCP calls: ${trace.length}
- Successful MCP calls: ${trace.filter((step) => step.status === "completed").length}
- Failed MCP calls: ${trace.filter((step) => step.status === "failed").length}`;
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
MCP observations:
${observations.join("\n\n---\n\n") || "No MCP observations were available."}

Agent trace:
${traceMarkdown(trace)}
`;

  let answer = "";
  let synthesisMode = "llm";

  try {
    answer = await askCopilot(
      `Use the MCP observations as live tool evidence. Answer the user request with concrete next actions, call out uncertainty, and do not claim to change records.\n\nUser request:\n${question}`,
      context,
      {
        timeoutMs: options.timeoutMs ?? 25000,
        numPredict: options.numPredict ?? 450,
        think: false,
      },
    );
  } catch (error) {
    synthesisMode = "deterministic";
    answer = deterministicAnswer(
      question,
      observations,
      trace,
      error,
    );
  }

  return {
    answer,
    trace,
    plannedToolCount: plannedCalls.length,
    synthesisMode,
  };
}
