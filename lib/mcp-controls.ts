export type McpTransport = "STDIO" | "Streamable HTTP" | "Both / Hybrid";

export type McpControl = {
  id: string;
  title: string;
  section: string;
  objective: string;
  reviewSteps: string[];
  evidence: string[];
  commonFindings: string[];
  appliesTo: McpTransport[];
};

export type McpReviewContext = {
  serverName: string;
  owner: string;
  transport: McpTransport;
  exposure: string;
  authModel: string;
  toolCount: string;
  dataClassification: string;
  hasWriteTools: string;
  hasExternalApis: string;
  hasFilesystemAccess: string;
  hasSecrets: string;
  supportsSampling: string;
  supportsElicitation: string;
};

export const mcpControls: McpControl[] = [
  {
    id: "MCP01",
    title: "Token mismanagement and secret exposure",
    section: "1. Identity, Tokens, and Secrets",
    objective:
      "Prevent MCP clients, servers, tools, logs, prompts, and error paths from exposing backend tokens or long-lived secrets.",
    reviewSteps: [
      "Inspect environment variables, custom headers, server config, tool arguments, logs, and error responses for secrets.",
      "Verify tokens are scoped, rotated, redacted, and never returned through tool output, resources, prompts, or sampling context.",
      "Attempt benign prompt requests that ask the model/tool to reveal headers, bearer tokens, API keys, or connection strings.",
    ],
    evidence: [
      "Redacted configuration screenshots",
      "Token scope/expiry evidence",
      "Negative test evidence showing secrets are not exposed",
      "Logging redaction proof",
    ],
    commonFindings: [
      "Hardcoded API key in MCP server package or launch command",
      "Authorization header echoed in tool errors",
      "Secrets available to all tools rather than per-tool least privilege",
    ],
    appliesTo: ["STDIO", "Streamable HTTP", "Both / Hybrid"],
  },
  {
    id: "MCP02",
    title: "Privilege escalation via scope creep",
    section: "2. Authorization and Tool Scope",
    objective:
      "Ensure low-privilege agents cannot invoke high-impact tools, hidden methods, broad resources, or cross-tenant operations.",
    reviewSteps: [
      "List tools, resources, prompts, roots, sampling, and elicitation capabilities exposed by the server.",
      "Map each tool to required user role, data boundary, tenant boundary, and allowed action type.",
      "Attempt direct MCP calls that bypass the LLM/UI workflow and invoke tools out of role or out of sequence.",
    ],
    evidence: [
      "Tool-to-role matrix",
      "Negative authorization test cases",
      "Server-side enforcement proof",
      "Tenant boundary test evidence",
    ],
    commonFindings: [
      "Read-only user can invoke write/delete tool",
      "Tool authorization delegated only to the AI client prompt",
      "No per-tool allowlist for high-risk functions",
    ],
    appliesTo: ["STDIO", "Streamable HTTP", "Both / Hybrid"],
  },
  {
    id: "MCP03",
    title: "Tool poisoning and untrusted tool metadata",
    section: "3. Tool Integrity",
    objective:
      "Prevent malicious tool descriptions, schemas, examples, or upstream data sources from steering the model into unsafe behavior.",
    reviewSteps: [
      "Inspect tool names, descriptions, parameter schemas, examples, and resource descriptions for hidden instructions.",
      "Test whether external data returned by tools can override developer/system intent or request unrelated actions.",
      "Verify tool outputs are treated as untrusted data and are escaped, attributed, and constrained.",
    ],
    evidence: [
      "Tool manifest review",
      "Prompt/tool injection test transcript",
      "Output sanitization evidence",
      "Change-control history for tool metadata",
    ],
    commonFindings: [
      "Tool description includes instruction to ignore prior policy",
      "Returned data can trigger unrelated tool calls",
      "No review workflow for MCP tool metadata changes",
    ],
    appliesTo: ["STDIO", "Streamable HTTP", "Both / Hybrid"],
  },
  {
    id: "MCP04",
    title: "Software supply chain and dependency tampering",
    section: "4. Build, Runtime, and Dependencies",
    objective:
      "Validate MCP server packages, dependencies, deployment images, and update channels are trusted and tamper-resistant.",
    reviewSteps: [
      "Review package source, lockfiles, image provenance, dependency scanning, and publishing controls.",
      "Confirm the client launches the expected binary/package and cannot be redirected to a rogue local server.",
      "Validate signed releases, pinned versions, and vulnerability triage for MCP dependencies.",
    ],
    evidence: [
      "SBOM or dependency scan",
      "Pinned version/lockfile",
      "Release provenance evidence",
      "Deployment change approval",
    ],
    commonFindings: [
      "Unpinned npm/Python dependency for MCP server",
      "Local STDIO server path writable by non-admin users",
      "No vulnerability review for MCP runtime packages",
    ],
    appliesTo: ["STDIO", "Streamable HTTP", "Both / Hybrid"],
  },
  {
    id: "MCP05",
    title: "Command injection and unsafe execution",
    section: "5. Tool Input Validation",
    objective:
      "Prevent JSON-RPC tool parameters from reaching shells, interpreters, file operations, or backend APIs unsafely.",
    reviewSteps: [
      "Identify tools that call shell commands, scripts, database queries, file paths, URLs, or admin APIs.",
      "Test JSON string breakout, path traversal, command separators, template injection, SSRF, and oversized parameters.",
      "Verify strict schemas, allowlists, encoding, parameterized calls, and non-shell execution paths.",
    ],
    evidence: [
      "Input schema for each high-risk tool",
      "Injection test results",
      "Code review notes for execution paths",
      "Rejected payload screenshots/logs",
    ],
    commonFindings: [
      "Tool passes user-controlled parameter into shell command",
      "Path parameter allows traversal outside configured root",
      "URL tool can reach internal metadata or admin endpoints",
    ],
    appliesTo: ["STDIO", "Streamable HTTP", "Both / Hybrid"],
  },
  {
    id: "MCP06",
    title: "Intent flow subversion and indirect prompt injection",
    section: "6. Prompt and Context Safety",
    objective:
      "Ensure secondary instructions inside resources, documents, tool outputs, or prompts cannot hijack the LLM goal.",
    reviewSteps: [
      "Feed tools/resources content containing hidden instructions, policy overrides, data exfiltration requests, and tool-call bait.",
      "Verify the client separates trusted instructions from untrusted tool/resource data.",
      "Confirm reviewer-facing warnings exist for untrusted documents, web pages, tickets, emails, and knowledge entries.",
    ],
    evidence: [
      "Indirect prompt injection test transcript",
      "Context separation design notes",
      "User confirmation gates for high-risk actions",
      "Tool output attribution examples",
    ],
    commonFindings: [
      "MCP resource text can instruct the agent to call unrelated tools",
      "No confirmation before write/destructive operations",
      "Tool output is inserted into privileged context without boundaries",
    ],
    appliesTo: ["STDIO", "Streamable HTTP", "Both / Hybrid"],
  },
  {
    id: "MCP07",
    title: "Insufficient authentication and authorization",
    section: "7. Remote MCP Access Control",
    objective:
      "Protect Streamable HTTP/SSE MCP servers from direct unauthenticated access, replay, weak headers, and bypass of the AI UI.",
    reviewSteps: [
      "Test initialize, tools/list, tools/call, resources/read, prompts/get, sampling, and elicitation endpoints directly.",
      "Verify authentication, authorization, rate limiting, origin/CORS restrictions, TLS, and session expiry.",
      "Review custom headers and bearer tokens for replay, missing audience, or broad shared secrets.",
    ],
    evidence: [
      "Direct endpoint negative tests",
      "AuthN/AuthZ design",
      "TLS and CORS evidence",
      "Rate-limit and replay test results",
    ],
    commonFindings: [
      "Remote MCP server accepts tools/list without authentication",
      "Static shared header grants broad tool access",
      "CORS/origin controls allow untrusted browser invocation",
    ],
    appliesTo: ["Streamable HTTP", "Both / Hybrid"],
  },
  {
    id: "MCP08",
    title: "Resource, root, and filesystem overexposure",
    section: "8. Data Boundary Controls",
    objective:
      "Constrain resources, roots, local files, memory, vector stores, and backend datasets exposed to MCP clients.",
    reviewSteps: [
      "List resources and roots, then test path traversal, symlinks, broad globbing, hidden files, and tenant data mixing.",
      "Verify data minimization, classification checks, and row/object-level authorization before resource reads.",
      "Confirm sensitive local paths, secrets, source code, logs, and user home directories are not exposed.",
    ],
    evidence: [
      "Resources/roots inventory",
      "Filesystem boundary tests",
      "Data classification mapping",
      "Cross-tenant negative tests",
    ],
    commonFindings: [
      "Root points to broad user home or project parent directory",
      "Resource endpoint exposes logs containing secrets",
      "Vector search returns another tenant/user data",
    ],
    appliesTo: ["STDIO", "Streamable HTTP", "Both / Hybrid"],
  },
  {
    id: "MCP09",
    title: "Unsafe sampling, elicitation, and human-in-the-loop flows",
    section: "9. Agentic Interaction Controls",
    objective:
      "Govern MCP features where servers request model sampling, ask users for information, or trigger agentic follow-up.",
    reviewSteps: [
      "Verify sampling requests cannot smuggle privileged prompts, secrets, or unrelated objectives.",
      "Test elicitation prompts for phishing, sensitive data collection, and misleading consent text.",
      "Confirm human approval is required before external sends, writes, purchases, tickets, or destructive actions.",
    ],
    evidence: [
      "Sampling policy",
      "Elicitation copy review",
      "Approval workflow screenshots",
      "Audit logs for human decisions",
    ],
    commonFindings: [
      "Server can request sampling with hidden privileged context",
      "Elicitation asks for passwords/tokens",
      "No audit trail for human approval decisions",
    ],
    appliesTo: ["STDIO", "Streamable HTTP", "Both / Hybrid"],
  },
  {
    id: "MCP10",
    title: "Context injection, memory leakage, and over-sharing",
    section: "10. Logging, Memory, and Auditability",
    objective:
      "Prevent sensitive context from one user/session/tool from leaking into another through logs, cache, memory, transcripts, or shared agents.",
    reviewSteps: [
      "Review logging, transcripts, vector DB entries, cache, telemetry, and debugging output for sensitive content.",
      "Test session isolation between users, tenants, roles, and concurrent MCP conversations.",
      "Confirm audit logs capture tool calls, actor, inputs summary, outputs summary, denial events, and approvals.",
    ],
    evidence: [
      "Redacted logging proof",
      "Session isolation test evidence",
      "Audit trail sample",
      "Retention and deletion policy",
    ],
    commonFindings: [
      "Tool output from one session appears in another user's context",
      "Prompt/tool transcripts store secrets without retention limits",
      "Audit logs lack actor or tool parameter summary",
    ],
    appliesTo: ["STDIO", "Streamable HTTP", "Both / Hybrid"],
  },
];

export function controlsForMcpTransport(transport: McpTransport) {
  return mcpControls.filter((control) => control.appliesTo.includes(transport));
}

export function resolveMcpControl(
  control: McpControl,
  context: McpReviewContext,
) {
  if (control.id === "MCP07" && context.transport === "STDIO") {
    return {
      status: "NA",
      comment:
        "Remote MCP HTTP/SSE authentication controls are not applicable to a local STDIO-only MCP server. Confirm local process launch permissions instead.",
    };
  }

  if (control.id === "MCP08" && context.hasFilesystemAccess === "No") {
    return {
      status: "NA",
      comment:
        "Filesystem/root exposure testing is not applicable because the MCP server does not expose local file or root access.",
    };
  }

  if (control.id === "MCP09" && context.supportsSampling === "No" && context.supportsElicitation === "No") {
    return {
      status: "NA",
      comment:
        "Sampling and elicitation controls are not applicable because the MCP server does not expose model-request or user-elicitation features.",
    };
  }

  if (control.id === "MCP05" && context.hasWriteTools === "No" && context.hasExternalApis === "No") {
    return {
      status: "Open",
      comment:
        "Validate read-only tool parameters, resource identifiers, and lookup inputs for injection even when no write/API tools are declared.",
    };
  }

  return {
    status: "Open",
    comment:
      "Reviewer to validate applicability, record observations, attach evidence, and update final status.",
  };
}
