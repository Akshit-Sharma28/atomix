"use client";

import {
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  FileText,
  Globe2,
  KeyRound,
  Loader2,
  Lock,
  Network,
  Play,
  ShieldCheck,
  Sparkles,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import {
  AlignmentType as DocxAlignmentType,
  BorderStyle as DocxBorderStyle,
  Document as DocxDocument,
  HeadingLevel as DocxHeadingLevel,
  Packer as DocxPacker,
  Paragraph as DocxParagraph,
  Table as DocxTable,
  TableCell as DocxTableCell,
  TableLayoutType as DocxTableLayoutType,
  TableRow as DocxTableRow,
  TextRun as DocxTextRun,
  VerticalAlign as DocxVerticalAlign,
  WidthType as DocxWidthType,
} from "docx";
import { useMemo, useState } from "react";

import {
  controlsForMcpTransport,
  mcpControls,
  resolveMcpControl,
  type McpControl,
  type McpReviewContext,
  type McpTransport,
} from "@/lib/mcp-controls";

const transports: McpTransport[] = ["Streamable HTTP", "STDIO", "Both / Hybrid"];
const yesNo = ["Yes", "No"];
const tabs = ["Overview", "Inspector", "Exports", "Prompts", "Draft"] as const;
const inspectorMethods = [
  "initialize",
  "tools/list",
  "tools/call",
  "resources/list",
  "resources/read",
  "prompts/list",
  "prompts/get",
  "ping",
];

const resourcePresets = [
  "atomix://dashboard/summary",
  "atomix://mcp/controls",
];

const promptPresets = ["atomix_security_review_brief"];

const atomixToolPresets = [
  {
    name: "atomix.dashboard_summary",
    argumentsJson: "{}",
  },
  {
    name: "atomix.search_projects",
    argumentsJson: '{\n  "query": "",\n  "limit": 10\n}',
  },
  {
    name: "atomix.list_reviews",
    argumentsJson: '{\n  "limit": 10\n}',
  },
  {
    name: "atomix.list_findings",
    argumentsJson: '{\n  "severity": "Critical",\n  "limit": 10\n}',
  },
  {
    name: "atomix.get_mcp_controls",
    argumentsJson: '{\n  "transport": "Streamable HTTP"\n}',
  },
];

const mcpSecurityPromptLibrary = [
  {
    id: "capability-inventory",
    category: "Discovery",
    title: "Capability inventory and open-by-default tools",
    prompt:
      "Act as an MCP security reviewer. Enumerate tools, resources, prompts, roots, sampling, and elicitation. Identify open-by-default capabilities, missing auth checks, and evidence needed for FEAD.",
    evidence:
      "tools/list, resources/list, prompts/list, auth headers tested, role used, and screenshots or JSON-RPC output.",
  },
  {
    id: "direct-invocation",
    category: "Authorization",
    title: "Direct tool invocation abuse",
    prompt:
      "Test whether a user can directly call MCP tools outside the intended agent workflow. Check role boundaries, project scoping, destructive actions, and whether tool responses leak cross-tenant data.",
    evidence:
      "Allowed and denied JSON-RPC calls, user role, project/SR scope, response payload, and server-side audit entry.",
  },
  {
    id: "prompt-injection",
    category: "Injection",
    title: "Indirect prompt injection via resource or tool output",
    prompt:
      "Review MCP resources and tool outputs for instructions that could override the system, reveal secrets, call other tools, or exfiltrate data. Recommend sanitization and trust-boundary controls.",
    evidence:
      "Injected sample payload, source resource/tool, model/tool behavior, mitigation status, and residual risk.",
  },
  {
    id: "destructive-tools",
    category: "Safety",
    title: "Write/destructive tool guardrails",
    prompt:
      "Assess MCP tools that create, update, delete, assign, export, or send data. Verify confirmation, RBAC, audit logging, idempotency, rollback, and human approval requirements.",
    evidence:
      "Tool schema, action transcript, approval step, audit record, and rollback/compensating action notes.",
  },
  {
    id: "secrets-egress",
    category: "Data Protection",
    title: "Secret and sensitive data exfiltration",
    prompt:
      "Inspect whether tokens, credentials, PII, confidential evidence, or customer data can appear in prompts, resources, logs, tool arguments, exports, or model responses.",
    evidence:
      "Redaction examples, blocked secret patterns, log excerpts, data classification, and export handling notes.",
  },
  {
    id: "network-ssrf",
    category: "Transport",
    title: "SSRF and network egress through tool arguments",
    prompt:
      "Test whether MCP tools can reach localhost, link-local metadata services, internal hosts, file URLs, or unexpected external endpoints through URL, host, path, or connector arguments.",
    evidence:
      "Blocked and allowed endpoint attempts, validation rules, network policy, and server-side error responses.",
  },
  {
    id: "stdio-local",
    category: "STDIO",
    title: "STDIO local process and filesystem hardening",
    prompt:
      "Evaluate STDIO MCP server risk: local process permissions, filesystem roots, environment variables, shell execution, package trust, startup command integrity, and desktop inspector exposure.",
    evidence:
      "Startup command, environment redaction, root allowlist, local user permissions, and process isolation notes.",
  },
  {
    id: "sampling-elicitation",
    category: "Agentic Flow",
    title: "Sampling and elicitation abuse cases",
    prompt:
      "If the MCP server supports sampling or elicitation, test whether it can request sensitive user input, trigger untrusted model calls, bypass consent, or create confusing human-in-the-loop flows.",
    evidence:
      "Sampling/elicitation transcript, consent copy, data requested, role involved, and approval/denial behavior.",
  },
];

const defaultContext: McpReviewContext = {
  serverName: "MCP Security Review",
  owner: "Application / Platform team",
  transport: "Streamable HTTP",
  exposure: "Internal",
  authModel: "Bearer token / custom headers",
  toolCount: "3",
  dataClassification: "Internal",
  hasWriteTools: "No",
  hasExternalApis: "Yes",
  hasFilesystemAccess: "No",
  hasSecrets: "Yes",
  supportsSampling: "No",
  supportsElicitation: "No",
};

export default function McpReviewAgent() {
  const [context, setContext] = useState<McpReviewContext>(defaultContext);
  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]>("Overview");
  const [inspectorUrl, setInspectorUrl] = useState("");
  const [inspectorMethod, setInspectorMethod] = useState("tools/list");
  const [authHeaderName, setAuthHeaderName] = useState("Authorization");
  const [authHeaderValue, setAuthHeaderValue] = useState("");
  const [extraHeadersJson, setExtraHeadersJson] = useState("");
  const [toolName, setToolName] = useState("atomix.dashboard_summary");
  const [toolArgumentsJson, setToolArgumentsJson] = useState("{}");
  const [resourceUri, setResourceUri] = useState("atomix://dashboard/summary");
  const [promptName, setPromptName] = useState("atomix_security_review_brief");
  const [promptArgumentsJson, setPromptArgumentsJson] = useState(
    '{\n  "focus": "MCP controls"\n}',
  );
  const [inspectorLoading, setInspectorLoading] = useState(false);
  const [inspectorResult, setInspectorResult] =
    useState<Record<string, unknown> | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState("");
  const applicableControls = useMemo(
    () => controlsForMcpTransport(context.transport),
    [context.transport],
  );
  const openControls = applicableControls.filter(
    (control) => resolveMcpControl(control, context).status !== "NA",
  );
  const naControls = applicableControls.length - openControls.length;
  const reportMarkdown = useMemo(
    () => buildMcpReviewMarkdown(context, applicableControls),
    [context, applicableControls],
  );

  function updateContext<K extends keyof McpReviewContext>(
    key: K,
    value: McpReviewContext[K],
  ) {
    setContext((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function downloadFead() {
    const blob = await buildMcpFeadDocx(context, applicableControls);
    triggerDownload(blob, `${safeFilename(context.serverName)}-mcp-fead.docx`);
  }

  async function downloadGuide() {
    const blob = await buildMcpGuideDocx(context, applicableControls);
    triggerDownload(blob, `${safeFilename(context.serverName)}-mcp-security-guide.docx`);
  }

  function downloadMarkdown() {
    const blob = new Blob([reportMarkdown], {
      type: "text/markdown;charset=utf-8",
    });
    triggerDownload(blob, `${safeFilename(context.serverName)}-mcp-review-plan.md`);
  }

  async function runInspector() {
    setInspectorLoading(true);
    setInspectorResult(null);

    try {
      const response = await fetch("/api/agent/mcp-inspector", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUrl: inspectorUrl,
          method: inspectorMethod,
          authHeaderName,
          authHeaderValue,
          extraHeadersJson,
          toolName,
          toolArgumentsJson,
          resourceUri,
          promptName,
          promptArgumentsJson,
        }),
      });
      const data = (await response.json()) as Record<string, unknown>;
      setInspectorResult({
        ...data,
        ok: response.ok && Boolean(data.ok),
      });
    } catch (error) {
      setInspectorResult({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to run MCP inspector request.",
      });
    } finally {
      setInspectorLoading(false);
    }
  }

  async function copyPrompt(prompt: string, promptId: string) {
    await navigator.clipboard.writeText(prompt);
    setCopiedPromptId(promptId);
    window.setTimeout(() => setCopiedPromptId(""), 1800);
  }

  return (
    <section className="mt-8 rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/20">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-200">
            <Network size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
              MCP Review Agent
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              MCP security review planner and FEAD generator
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Build an MCP-specific review pack for JSON-RPC tools, STDIO and
              Streamable HTTP transports, resources, prompts, roots, sampling,
              elicitation, token handling, and agentic abuse cases.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
          <Bot className="mr-2 inline" size={16} />
          Deterministic MCP FEAD with copilot-ready checklist
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              activeTab === tab
                ? "bg-cyan-400 text-slate-950"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Metric label="Applicable MCP Controls" value={applicableControls.length} />
        <Metric label="Open by Default" value={openControls.length} />
        <Metric label="Auto NA" value={naControls} />
        <Metric label="Library Size" value={mcpControls.length} />
      </div>

      <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-cyan-100">
              <ShieldCheck size={16} />
              Review outputs and data handling
            </div>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
              Intake fields stay in this browser until you export or run the
              inspector. Exports download locally; inspector probes call the
              Atomix API and return JSON evidence. Nothing is written to the
              database from this page unless a downstream workflow explicitly
              saves the artifact.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadFead}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
            >
              <Download size={15} />
              FEAD .docx
            </button>
            <button
              type="button"
              onClick={downloadGuide}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 px-3 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-400/10"
            >
              <FileText size={15} />
              Guide .docx
            </button>
            <button
              type="button"
              onClick={downloadMarkdown}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800"
            >
              <ClipboardCheck size={15} />
              Markdown
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("Prompts")}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-400/30 px-3 py-2 text-sm font-bold text-violet-100 hover:bg-violet-400/10"
            >
              <Sparkles size={15} />
              Prompt library
            </button>
          </div>
        </div>
      </div>

      {activeTab === "Overview" && (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TextField
            label="MCP Server / App"
            value={context.serverName}
            onChange={(value) => updateContext("serverName", value)}
          />
          <TextField
            label="Owner"
            value={context.owner}
            onChange={(value) => updateContext("owner", value)}
          />
          <SelectField
            label="Transport"
            options={transports}
            value={context.transport}
            onChange={(value) => updateContext("transport", value as McpTransport)}
          />
          <SelectField
            label="Exposure"
            options={["Internal", "Internet", "Local developer only", "Third-party hosted"]}
            value={context.exposure}
            onChange={(value) => updateContext("exposure", value)}
          />
          <TextField
            label="Auth Model"
            value={context.authModel}
            onChange={(value) => updateContext("authModel", value)}
          />
          <TextField
            label="Tool Count"
            value={context.toolCount}
            onChange={(value) => updateContext("toolCount", value)}
          />
          <SelectField
            label="Data Classification"
            options={["Public", "Internal", "Confidential", "Restricted"]}
            value={context.dataClassification}
            onChange={(value) => updateContext("dataClassification", value)}
          />
          <SelectField
            label="Write / Destructive Tools"
            options={yesNo}
            value={context.hasWriteTools}
            onChange={(value) => updateContext("hasWriteTools", value)}
          />
          <SelectField
            label="External APIs"
            options={yesNo}
            value={context.hasExternalApis}
            onChange={(value) => updateContext("hasExternalApis", value)}
          />
          <SelectField
            label="Filesystem / Roots"
            options={yesNo}
            value={context.hasFilesystemAccess}
            onChange={(value) => updateContext("hasFilesystemAccess", value)}
          />
          <SelectField
            label="Secrets / Tokens"
            options={yesNo}
            value={context.hasSecrets}
            onChange={(value) => updateContext("hasSecrets", value)}
          />
          <SelectField
            label="Sampling"
            options={yesNo}
            value={context.supportsSampling}
            onChange={(value) => updateContext("supportsSampling", value)}
          />
          <SelectField
            label="Elicitation"
            options={yesNo}
            value={context.supportsElicitation}
            onChange={(value) => updateContext("supportsElicitation", value)}
          />
        </div>
      )}

      {activeTab === "Inspector" && (
        <InspectorPanel
          targetUrl={inspectorUrl}
          setTargetUrl={setInspectorUrl}
          method={inspectorMethod}
          setMethod={setInspectorMethod}
          authHeaderName={authHeaderName}
          setAuthHeaderName={setAuthHeaderName}
          authHeaderValue={authHeaderValue}
          setAuthHeaderValue={setAuthHeaderValue}
          extraHeadersJson={extraHeadersJson}
          setExtraHeadersJson={setExtraHeadersJson}
          toolName={toolName}
          setToolName={setToolName}
          toolArgumentsJson={toolArgumentsJson}
          setToolArgumentsJson={setToolArgumentsJson}
          resourceUri={resourceUri}
          setResourceUri={setResourceUri}
          promptName={promptName}
          setPromptName={setPromptName}
          promptArgumentsJson={promptArgumentsJson}
          setPromptArgumentsJson={setPromptArgumentsJson}
          loading={inspectorLoading}
          result={inspectorResult}
          onRun={runInspector}
        />
      )}

      {activeTab === "Exports" && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <ExportCard
            title="MCP FEAD Workbook"
            description="Reviewer-editable control workbook with MCP01-MCP10, statuses, evidence, and comments."
            icon={Download}
            buttonLabel="Download FEAD .docx"
            onClick={downloadFead}
          />
          <ExportCard
            title="MCP Security Guide"
            description="Testing guide for transports, tools, resources, prompts, tokens, and agentic flows."
            icon={FileText}
            buttonLabel="Download Guide .docx"
            onClick={downloadGuide}
          />
          <ExportCard
            title="Markdown Plan"
            description="Fast review plan for tickets, chat, or reviewer notes."
            icon={ClipboardCheck}
            buttonLabel="Download Markdown"
            onClick={downloadMarkdown}
          />
        </div>
      )}

      {activeTab === "Prompts" && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {mcpSecurityPromptLibrary.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-200">
                    {item.category}
                  </span>
                  <h3 className="mt-3 text-lg font-black text-white">
                    {item.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => copyPrompt(item.prompt, item.id)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-cyan-400/30 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-400/10"
                >
                  <Copy size={14} />
                  {copiedPromptId === item.id ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-4 rounded-2xl border border-slate-800 bg-black/30 p-4 text-sm leading-6 text-slate-300">
                {item.prompt}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Evidence to capture
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {item.evidence}
              </p>
            </article>
          ))}
        </div>
      )}

      {activeTab === "Draft" && (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-cyan-100">
            <ShieldCheck size={16} />
            MCP Review Copilot Draft
          </div>
          <pre className="max-h-[34rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-black/50 p-4 text-sm leading-6 text-slate-200">
            {reportMarkdown}
          </pre>
        </div>
      )}
    </section>
  );
}

function buildMcpReviewMarkdown(
  context: McpReviewContext,
  controls: McpControl[],
) {
  const openControls = controls.filter(
    (control) => resolveMcpControl(control, context).status !== "NA",
  );
  const naControls = controls.filter(
    (control) => resolveMcpControl(control, context).status === "NA",
  );

  return `# MCP Security Review Plan

## 1. Review Context
- MCP server/application: ${context.serverName}
- Owner: ${context.owner}
- Transport: ${context.transport}
- Exposure: ${context.exposure}
- Authentication model: ${context.authModel}
- Tool count: ${context.toolCount}
- Data classification: ${context.dataClassification}
- Write/destructive tools: ${context.hasWriteTools}
- External APIs: ${context.hasExternalApis}
- Filesystem/roots: ${context.hasFilesystemAccess}
- Secrets/tokens: ${context.hasSecrets}
- Sampling: ${context.supportsSampling}
- Elicitation: ${context.supportsElicitation}

## 2. Executive Review Focus
- Confirm the MCP client cannot be used as an authorization bypass for direct tool calls.
- Validate JSON-RPC tool schemas, parameter validation, and role-specific tool authorization.
- Review transport-specific risk: local STDIO process launch controls or remote Streamable HTTP/SSE authentication and replay controls.
- Treat tools, resources, prompts, roots, sampling, and elicitation as separate attack surfaces.
- Confirm tokens, tool output, memory, transcripts, and logs do not leak secrets or cross-user context.

## 3. Applicable MCP FEAD Controls
${openControls
  .map((control) => {
    const resolution = resolveMcpControl(control, context);

    return `- **${control.id} ${control.title}** — ${resolution.status}. ${resolution.comment}`;
  })
  .join("\n")}

## 4. Auto-NA Controls
${naControls.length > 0
  ? naControls
      .map((control) => {
        const resolution = resolveMcpControl(control, context);

        return `- **${control.id} ${control.title}** — ${resolution.comment}`;
      })
      .join("\n")
  : "- No MCP controls were auto-marked NA from the current intake."}

## 5. Reviewer Test Script
- Inventory MCP capabilities using initialize, tools/list, resources/list, prompts/list, roots/list, sampling, elicitation, and metadata where available.
- Test direct invocation through MCP Inspector or equivalent client, not only through the LLM chat UI.
- Attempt role bypass, tenant bypass, tool sequencing bypass, excessive parameter values, path traversal, SSRF, command injection, and indirect prompt injection.
- Verify logs redact tokens and preserve actor, tool, timestamp, decision, denial, and approval evidence.
- Attach screenshots/transcripts for both positive and negative tests before sign-off.
`;
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
      />
    </label>
  );
}

function SelectField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-cyan-500/10 bg-slate-950/80 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-cyan-300">{value}</p>
    </div>
  );
}

function InspectorPanel({
  targetUrl,
  setTargetUrl,
  method,
  setMethod,
  authHeaderName,
  setAuthHeaderName,
  authHeaderValue,
  setAuthHeaderValue,
  extraHeadersJson,
  setExtraHeadersJson,
  toolName,
  setToolName,
  toolArgumentsJson,
  setToolArgumentsJson,
  resourceUri,
  setResourceUri,
  promptName,
  setPromptName,
  promptArgumentsJson,
  setPromptArgumentsJson,
  loading,
  result,
  onRun,
}: {
  targetUrl: string;
  setTargetUrl: (value: string) => void;
  method: string;
  setMethod: (value: string) => void;
  authHeaderName: string;
  setAuthHeaderName: (value: string) => void;
  authHeaderValue: string;
  setAuthHeaderValue: (value: string) => void;
  extraHeadersJson: string;
  setExtraHeadersJson: (value: string) => void;
  toolName: string;
  setToolName: (value: string) => void;
  toolArgumentsJson: string;
  setToolArgumentsJson: (value: string) => void;
  resourceUri: string;
  setResourceUri: (value: string) => void;
  promptName: string;
  setPromptName: (value: string) => void;
  promptArgumentsJson: string;
  setPromptArgumentsJson: (value: string) => void;
  loading: boolean;
  result: Record<string, unknown> | null;
  onRun: () => void;
}) {
  const resultOk = Boolean(result?.ok);
  const resultStatus =
    typeof result?.status === "number" ? String(result.status) : "No status";
  const resultElapsed =
    typeof result?.elapsedMs === "number" ? `${result.elapsedMs} ms` : "Pending";

  function useCurrentDeployment() {
    setTargetUrl(`${window.location.origin}/api/mcp`);
  }

  function useToolPreset(presetName: string) {
    const preset = atomixToolPresets.find((item) => item.name === presetName);

    setToolName(presetName);

    if (preset) {
      setToolArgumentsJson(preset.argumentsJson);
    }
  }

  function usePromptPreset(presetName: string) {
    setPromptName(presetName);

    if (presetName === "atomix_security_review_brief") {
      setPromptArgumentsJson('{\n  "focus": "MCP controls"\n}');
    }
  }

  return (
    <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] p-5">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold text-cyan-100">
              MCP Inspector Lite
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Send raw JSON-RPC probes to Streamable HTTP MCP endpoints and
              capture direct-invocation evidence.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200">
            <Lock size={13} />
            Production token ready
          </span>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <InspectorHint
            icon={Globe2}
            title="Remote HTTP"
            detail="Use HTTPS in production."
          />
          <InspectorHint
            icon={KeyRound}
            title="Bearer Token"
            detail="Required for /api/mcp."
          />
          <InspectorHint
            icon={Terminal}
            title="STDIO"
            detail="Use desktop Inspector."
          />
        </div>

        <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            Endpoint presets
          </p>
          <div className="flex flex-wrap gap-2">
            <PresetButton label="This deployment" onClick={useCurrentDeployment} />
            <PresetButton
              label="Local dev"
              onClick={() => setTargetUrl("http://localhost:3001/api/mcp")}
            />
            <PresetButton
              label="Atomix prod"
              onClick={() => setTargetUrl("https://atomix.solutions/api/mcp")}
            />
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Localhost is allowed only in development. Production blocks
            localhost and link-local targets for SSRF protection.
          </p>
        </div>

        <div className="grid gap-4">
          <TextField
            label="MCP Endpoint URL"
            value={targetUrl}
            onChange={setTargetUrl}
          />
          <SelectField
            label="JSON-RPC Method"
            options={inspectorMethods}
            value={method}
            onChange={setMethod}
          />
          {method === "tools/call" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="mb-4 grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <SelectField
                  label="Atomix Tool"
                  options={atomixToolPresets.map((preset) => preset.name)}
                  value={toolName}
                  onChange={useToolPreset}
                />
                <TextField
                  label="Custom Tool Name"
                  value={toolName}
                  onChange={setToolName}
                />
              </div>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-400">
                  Tool Arguments JSON
                </span>
                <textarea
                  value={toolArgumentsJson}
                  onChange={(event) => setToolArgumentsJson(event.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-mono text-sm text-white"
                />
              </label>
            </div>
          )}
          {method === "resources/read" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <SelectField
                  label="Resource Preset"
                  options={resourcePresets}
                  value={resourceUri}
                  onChange={setResourceUri}
                />
                <TextField
                  label="Custom Resource URI"
                  value={resourceUri}
                  onChange={setResourceUri}
                />
              </div>
            </div>
          )}
          {method === "prompts/get" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="mb-4 grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <SelectField
                  label="Prompt Preset"
                  options={promptPresets}
                  value={promptName}
                  onChange={usePromptPreset}
                />
                <TextField
                  label="Custom Prompt Name"
                  value={promptName}
                  onChange={setPromptName}
                />
              </div>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-400">
                  Prompt Arguments JSON
                </span>
                <textarea
                  value={promptArgumentsJson}
                  onChange={(event) => setPromptArgumentsJson(event.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-mono text-sm text-white"
                />
              </label>
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <TextField
              label="Auth Header Name"
              value={authHeaderName}
              onChange={setAuthHeaderName}
            />
            <PasswordField
              label="Auth Header Value"
              value={authHeaderValue}
              onChange={setAuthHeaderValue}
            />
          </div>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">
              Extra Headers JSON
            </span>
            <textarea
              value={extraHeadersJson}
              onChange={(event) => setExtraHeadersJson(event.target.value)}
              rows={4}
              placeholder='{"X-AbuseIPDB-Client":"reviewer"}'
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-mono text-sm text-white"
            />
          </label>
          <button
            type="button"
            onClick={onRun}
            disabled={loading || !targetUrl.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 md:w-fit"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Play size={16} />
            )}
            {loading ? "Running probe" : "Run MCP Probe"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-cyan-100">
              Probe Result
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Capture this output as evidence for direct invocation,
              authentication, and capability inventory tests.
            </p>
          </div>
          {result && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                resultOk
                  ? "bg-emerald-400/10 text-emerald-200"
                  : "bg-red-400/10 text-red-200"
              }`}
            >
              {resultOk ? "Reachable" : "Blocked / failed"}
            </span>
          )}
        </div>
        <div className="mb-3 grid gap-3 md:grid-cols-3">
          <ResultMetric label="Status" value={resultStatus} ok={resultOk} />
          <ResultMetric label="Latency" value={resultElapsed} ok={resultOk} />
          <ResultMetric
            label="Evidence"
            value={result ? "Captured" : "Waiting"}
            ok={resultOk}
          />
        </div>
        <pre className="max-h-[31rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-black/60 p-4 text-xs leading-5 text-slate-200">
          {result
            ? JSON.stringify(result, null, 2)
            : "Run initialize, tools/list, tools/call, resources/list, resources/read, prompts/list, prompts/get, or ping to collect MCP evidence."}
        </pre>
      </div>
    </div>
  );
}

function InspectorHint({
  icon: Icon,
  title,
  detail,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-100">
        <Icon size={15} className="text-cyan-200" />
        {title}
      </div>
      <p className="text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function PresetButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 px-3 py-2 text-xs font-bold text-cyan-100 transition hover:bg-cyan-400/10"
    >
      <CheckCircle2 size={13} />
      {label}
    </button>
  );
}

function ResultMetric({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-black/40 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-black ${
          ok ? "text-emerald-200" : "text-slate-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-400">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
      />
    </label>
  );
}

function ExportCard({
  title,
  description,
  icon: Icon,
  buttonLabel,
  onClick,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-200">
        <Icon size={20} />
      </div>
      <h3 className="text-lg font-black text-white">{title}</h3>
      <p className="mt-2 min-h-16 text-sm leading-6 text-slate-400">
        {description}
      </p>
      <button
        type="button"
        onClick={onClick}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 px-4 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/10"
      >
        <Download size={15} />
        {buttonLabel}
      </button>
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "mcp-review";
}

async function buildMcpFeadDocx(
  context: McpReviewContext,
  controls: McpControl[],
) {
  const children: (DocxParagraph | DocxTable)[] = [
    titleParagraph("Customized MCP FEAD Review Workbook"),
    subtitleParagraph("Generated by Atomix MCP Review Agent"),
    contextTable(context),
    bodyParagraph(
      "Each MCP control includes objective, test guidance, evidence expectations, status, reviewer comments, and artifacts required. Controls can be edited before final submission.",
    ),
  ];

  let currentSection = "";

  for (const control of controls) {
    if (control.section !== currentSection) {
      currentSection = control.section;
      children.push(sectionHeading(currentSection));
    }

    children.push(controlTable(control, context));
    children.push(new DocxParagraph({ text: "", spacing: { after: 160 } }));
  }

  return DocxPacker.toBlob(
    new DocxDocument({
      creator: "Atomix MCP Review Agent",
      title: "Customized MCP FEAD Review Workbook",
      description: "Reviewer-editable MCP security FEAD generated from MCP intake facts.",
      styles: docStyles(),
      sections: [{ properties: pageProperties(), children }],
    }),
  );
}

async function buildMcpGuideDocx(
  context: McpReviewContext,
  controls: McpControl[],
) {
  const children: (DocxParagraph | DocxTable)[] = [
    titleParagraph("MCP Security Review Guide"),
    subtitleParagraph(`Review guide for ${context.serverName}`),
    contextTable(context),
    sectionHeading("Review Method"),
    ...[
      "Confirm architecture: MCP client, transport, server hosting model, auth boundary, tool inventory, resources, prompts, roots, sampling, and elicitation.",
      "Use MCP Inspector or an equivalent raw client to test direct JSON-RPC access. Do not rely only on the LLM chat UI.",
      "Separate transport testing: STDIO reviews focus on local process launch, file permissions, and local secret exposure; Streamable HTTP reviews focus on TLS, auth, CORS/origin, replay, and SSE session behavior.",
      "Treat all tool output and resource content as untrusted data that can carry indirect prompt injection.",
      "Require human confirmation and audit trail for writes, deletes, external sends, ticket creation, purchases, or high-impact API calls.",
    ].map((step) => bulletParagraph(step)),
    sectionHeading("Attack Vector Checklist"),
    ...controls.map((control) =>
      bulletParagraph(`${control.id} ${control.title}: ${control.commonFindings.join("; ")}`),
    ),
    sectionHeading("Evidence Required Before Sign-off"),
    ...[
      "Capability inventory: tools/list, resources, prompts, roots, sampling, elicitation, and metadata where available.",
      "Tool-to-role matrix and negative direct invocation tests.",
      "Token redaction evidence and log/audit examples.",
      "Injection tests for JSON-RPC parameters and indirect prompt injection tests for resources/tool outputs.",
      "Supply-chain evidence for server package, dependencies, image, and deployment path.",
    ].map((item) => bulletParagraph(item)),
  ];

  return DocxPacker.toBlob(
    new DocxDocument({
      creator: "Atomix MCP Review Agent",
      title: "MCP Security Review Guide",
      description: "Guide for conducting MCP security reviews.",
      styles: docStyles(),
      sections: [{ properties: pageProperties(), children }],
    }),
  );
}

function titleParagraph(text: string) {
  return new DocxParagraph({
    heading: DocxHeadingLevel.TITLE,
    alignment: DocxAlignmentType.CENTER,
    spacing: { after: 120 },
    children: [
      new DocxTextRun({
        text,
        bold: true,
        color: "0891B2",
        font: "Arial",
        size: 32,
      }),
    ],
  });
}

function subtitleParagraph(text: string) {
  return new DocxParagraph({
    alignment: DocxAlignmentType.CENTER,
    spacing: { after: 280 },
    children: [
      new DocxTextRun({
        text,
        color: "64748B",
        font: "Arial",
        size: 20,
      }),
    ],
  });
}

function sectionHeading(text: string) {
  return new DocxParagraph({
    heading: DocxHeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [
      new DocxTextRun({
        text,
        bold: true,
        color: "0891B2",
        font: "Arial",
        size: 24,
      }),
    ],
  });
}

function bodyParagraph(text: string) {
  return new DocxParagraph({
    spacing: { after: 160 },
    children: [new DocxTextRun({ text, font: "Arial", size: 20 })],
  });
}

function bulletParagraph(text: string) {
  return new DocxParagraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children: [new DocxTextRun({ text, font: "Arial", size: 20 })],
  });
}

function contextTable(context: McpReviewContext) {
  const rows = [
    ["MCP Server", context.serverName, "Owner", context.owner],
    ["Transport", context.transport, "Exposure", context.exposure],
    ["Auth Model", context.authModel, "Tool Count", context.toolCount],
    ["Data Classification", context.dataClassification, "Secrets/Tokens", context.hasSecrets],
    ["Write Tools", context.hasWriteTools, "External APIs", context.hasExternalApis],
    ["Filesystem/Roots", context.hasFilesystemAccess, "Sampling/Elicitation", `${context.supportsSampling} / ${context.supportsElicitation}`],
  ];

  return new DocxTable({
    width: { size: 9360, type: DocxWidthType.DXA },
    columnWidths: [1872, 2808, 1872, 2808],
    layout: DocxTableLayoutType.FIXED,
    rows: rows.map((row) =>
      new DocxTableRow({
        children: row.map((value, index) =>
          new DocxTableCell({
            width: {
              size: index % 2 === 0 ? 1872 : 2808,
              type: DocxWidthType.DXA,
            },
            shading: { fill: index % 2 === 0 ? "E0F2FE" : "FFFFFF" },
            borders: tableBorders(),
            margins: {
              top: 120,
              bottom: 120,
              left: 120,
              right: 120,
            },
            children: [
              new DocxParagraph({
                children: [
                  new DocxTextRun({
                    text: value,
                    bold: index % 2 === 0,
                    color: index % 2 === 0 ? "0F172A" : "334155",
                    font: "Arial",
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
        ),
      }),
    ),
  });
}

function controlTable(control: McpControl, context: McpReviewContext) {
  const resolution = resolveMcpControl(control, context);
  const rows = [
    [
      `${control.id}\nBase`,
      `${control.title}\nSection: ${control.section}`,
      `Status:\n${resolution.status}`,
    ],
    ["Objective", control.objective, "Reviewer updates status here."],
    ["What needs to be done", control.reviewSteps.join("\n"), ""],
    ["Evidence required", control.evidence.join("\n"), ""],
    ["Common missed findings", control.commonFindings.join("\n"), ""],
    ["Security Reviewer Comments", resolution.comment, ""],
  ];

  return new DocxTable({
    width: { size: 9360, type: DocxWidthType.DXA },
    columnWidths: [2200, 5360, 1800],
    layout: DocxTableLayoutType.FIXED,
    rows: rows.map((row, rowIndex) =>
      new DocxTableRow({
        children: row.map((value, index) =>
          new DocxTableCell({
            width: {
              size: index === 0 ? 2200 : index === 1 ? 5360 : 1800,
              type: DocxWidthType.DXA,
            },
            verticalAlign: DocxVerticalAlign.TOP,
            shading: {
              fill: rowIndex === 0 || index === 0 ? "111827" : "FFFFFF",
            },
            borders: tableBorders(),
            margins: {
              top: 120,
              bottom: 120,
              left: 120,
              right: 120,
            },
            children: value.split("\n").map(
              (line, lineIndex) =>
                new DocxParagraph({
                  spacing: { after: 70 },
                  children: [
                    new DocxTextRun({
                      text: line,
                      bold: rowIndex === 0 || index === 0 || lineIndex === 0,
                      color: rowIndex === 0 || index === 0 ? "FFFFFF" : "0F172A",
                      font: "Arial",
                      size: 18,
                    }),
                  ],
                }),
            ),
          }),
        ),
      }),
    ),
  });
}

function tableBorders() {
  return {
    top: { style: DocxBorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    bottom: { style: DocxBorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    left: { style: DocxBorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    right: { style: DocxBorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  };
}

function docStyles() {
  return {
    default: {
      document: {
        run: {
          font: "Arial",
          size: 20,
        },
        paragraph: {
          spacing: {
            line: 276,
          },
        },
      },
    },
  };
}

function pageProperties() {
  return {
    page: {
      margin: {
        top: 720,
        right: 720,
        bottom: 720,
        left: 720,
      },
    },
  };
}
