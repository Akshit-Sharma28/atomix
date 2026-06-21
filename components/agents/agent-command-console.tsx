"use client";

import {
  Bot,
  ChevronDown,
  Code2,
  FileCheck2,
  Loader2,
  PlusCircle,
  Terminal,
} from "lucide-react";
import { useMemo, useState } from "react";

type CommandType =
  | "peer_review"
  | "create_user"
  | "create_project"
  | "create_sr"
  | "create_finding";

type RiskLevel = "High" | "Medium" | "Low";

type CommandPayload = {
  command: CommandType;
  data: Record<string, unknown>;
};

const commandOptions: {
  value: CommandType;
  label: string;
  helper: string;
}[] = [
  {
    value: "peer_review",
    label: "Peer Review Agent",
    helper: "Cross-check scope, artifacts, and scan evidence.",
  },
  {
    value: "create_project",
    label: "Create Project",
    helper: "Create a project record for review intake.",
  },
  {
    value: "create_sr",
    label: "Create SR",
    helper: "Create a security review under an existing project.",
  },
  {
    value: "create_finding",
    label: "Create Finding",
    helper: "Create a finding under a project or SR.",
  },
  {
    value: "create_user",
    label: "Create User",
    helper: "Admin-only user creation command.",
  },
];

const emptyPeerReview = {
  scope: "Web + LLM",
  typeOfReview: "FULL",
  spr: "SPR-9001",
  sr: "SR-9001-2026",
  typeOfApplication: "Internet",
  overallRisk: "High",
  confidentiality: "High" as RiskLevel,
  integrity: "Medium" as RiskLevel,
  availability: "High" as RiskLevel,
  network: "N - Network / Internet",
  authentication: "S - Single Auth",
  targetUrl: "https://example.com",
  ipAddress: "10.0.0.10",
  roles: "Admin, Reviewer, Standard User",
  feadWordFile: "/path/to/FEAD.docx",
  beadWordFile: "/path/to/BEAD.docx",
  llmFeadFile: "/path/to/LLM-FEAD.docx",
  scanReports: "/path/to/qualys.pdf\n/path/to/checkmarx.pdf\n/path/to/mend.pdf",
};

const emptyProject = {
  name: "New Customer Portal",
  client: "Retail Banking",
  sprId: "SPR-0100",
  riskTier: "High",
  businessOwner: "Business Owner Name",
  technicalOwner: "Tech Owner Name",
  projectManagerId: "",
};

const emptySr = {
  projectId: "paste-project-id",
  title: "External Web App Review",
  type: "WEB",
  priority: "High",
  status: "Requested",
  srId: "SR-2026-0001",
  dueDate: "2026-07-01",
};

const emptyFinding = {
  projectId: "paste-project-id",
  reviewId: "optional-review-id",
  title: "Missing HSTS Header",
  severity: "Medium",
  status: "Open",
  source: "Atomix Agent",
  description: "HSTS header is not present on the target application.",
  remediation: "Enable Strict-Transport-Security with a one-year max-age after validating HTTPS coverage.",
};

const emptyUser = {
  name: "Reviewer Name",
  email: "reviewer@example.com",
  role: "REVIEWER",
  password: "",
};

function Field({
  label,
  children,
  helper,
}: {
  label: string;
  children: React.ReactNode;
  helper?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-300">
        {label}
      </span>
      {children}
      {helper && <span className="mt-2 block text-xs text-slate-500">{helper}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-400/70";

function cleanLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export default function AgentCommandConsole() {
  const [commandType, setCommandType] = useState<CommandType>("peer_review");
  const [peerReview, setPeerReview] = useState(emptyPeerReview);
  const [project, setProject] = useState(emptyProject);
  const [sr, setSr] = useState(emptySr);
  const [finding, setFinding] = useState(emptyFinding);
  const [user, setUser] = useState(emptyUser);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [showJson, setShowJson] = useState(true);

  const selectedCommand = commandOptions.find(
    (option) => option.value === commandType,
  );

  const payload = useMemo<CommandPayload>(() => {
    if (commandType === "peer_review") {
      return {
        command: "peer_review",
        data: {
          scope: peerReview.scope,
          typeOfReview: peerReview.typeOfReview,
          spr: peerReview.spr,
          sr: peerReview.sr,
          typeOfApplication: peerReview.typeOfApplication,
          overallRisk: peerReview.overallRisk,
          risk: {
            confidentiality: peerReview.confidentiality,
            integrity: peerReview.integrity,
            availability: peerReview.availability,
          },
          network: peerReview.network,
          authentication: peerReview.authentication,
          targetUrl: optional(peerReview.targetUrl),
          ipAddress: optional(peerReview.ipAddress),
          roles: optional(peerReview.roles),
          files: {
            feadWordFile: peerReview.feadWordFile,
            beadWordFile: optional(peerReview.beadWordFile),
            llmFeadFile: optional(peerReview.llmFeadFile),
            scanReports: cleanLines(peerReview.scanReports),
          },
        },
      };
    }

    if (commandType === "create_project") {
      return {
        command: "create_project",
        data: {
          name: project.name,
          client: optional(project.client),
          sprId: optional(project.sprId),
          riskTier: project.riskTier,
          businessOwner: optional(project.businessOwner),
          technicalOwner: optional(project.technicalOwner),
          projectManagerId: optional(project.projectManagerId),
        },
      };
    }

    if (commandType === "create_sr") {
      return {
        command: "create_sr",
        data: {
          projectId: sr.projectId,
          title: sr.title,
          type: sr.type,
          priority: sr.priority,
          status: sr.status,
          srId: optional(sr.srId),
          dueDate: optional(sr.dueDate),
        },
      };
    }

    if (commandType === "create_finding") {
      return {
        command: "create_finding",
        data: {
          projectId: finding.projectId,
          reviewId: optional(finding.reviewId),
          title: finding.title,
          severity: finding.severity,
          status: finding.status,
          source: finding.source,
          description: optional(finding.description),
          remediation: optional(finding.remediation),
        },
      };
    }

    return {
      command: "create_user",
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        password: optional(user.password),
      },
    };
  }, [commandType, finding, peerReview, project, sr, user]);

  const jsonPreview = JSON.stringify(payload, null, 2);

  async function run() {
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/agent/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Invalid command");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-6">
      <div className="mb-5 flex items-start gap-3">
        <Bot className="text-cyan-300" size={24} />
        <div>
          <h2 className="text-xl font-bold text-white">DB Action Builder Agent</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Use friendly forms to build safe, whitelisted agent commands. Atomix
            converts the fields into the JSON payload and executes it through the
            governed command API. Assignment and intake agents are advisors on
            the Workflow page; this builder is for explicit record writes.
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-200">
          <FileCheck2 size={17} />
          Action builder
        </div>
        <div className="grid gap-3 text-xs text-slate-400 md:grid-cols-2">
          <p>Pick an action type, fill the fields, and run it directly.</p>
          <p>JSON remains available as a generated preview for audit/debugging.</p>
        </div>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-5">
        {commandOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setCommandType(option.value)}
            className={`rounded-2xl border p-4 text-left transition ${
              commandType === option.value
                ? "border-cyan-400/70 bg-cyan-400/10 text-white"
                : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-cyan-400/30"
            }`}
          >
            <p className="text-sm font-bold">{option.label}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {option.helper}
            </p>
          </button>
        ))}
      </div>

      <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/70 p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">
              {selectedCommand?.label}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              {selectedCommand?.helper}
            </p>
          </div>
          <button
            onClick={() => setShowJson((value) => !value)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 hover:border-cyan-400/40"
          >
            <Code2 size={16} />
            {showJson ? "Hide JSON" : "Show JSON"}
            <ChevronDown
              size={16}
              className={`transition ${showJson ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {commandType === "peer_review" && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Scope">
              <select
                value={peerReview.scope}
                onChange={(event) =>
                  setPeerReview({ ...peerReview, scope: event.target.value })
                }
                className={inputClass}
              >
                <option>Web only</option>
                <option>Web + LLM</option>
                <option>API</option>
                <option>LLM only</option>
                <option>Thick Client</option>
              </select>
            </Field>
            <Field label="Type of Review">
              <select
                value={peerReview.typeOfReview}
                onChange={(event) =>
                  setPeerReview({
                    ...peerReview,
                    typeOfReview: event.target.value,
                  })
                }
                className={inputClass}
              >
                <option>FULL</option>
                <option>Enhancement</option>
              </select>
            </Field>
            <Field label="Application Type">
              <select
                value={peerReview.typeOfApplication}
                onChange={(event) =>
                  setPeerReview({
                    ...peerReview,
                    typeOfApplication: event.target.value,
                  })
                }
                className={inputClass}
              >
                <option>Internal</option>
                <option>Intranet</option>
                <option>Internet</option>
                <option>Vendor</option>
              </select>
            </Field>
            <Field label="SPR">
              <input
                value={peerReview.spr}
                onChange={(event) =>
                  setPeerReview({ ...peerReview, spr: event.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="SR">
              <input
                value={peerReview.sr}
                onChange={(event) =>
                  setPeerReview({ ...peerReview, sr: event.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Overall Risk">
              <select
                value={peerReview.overallRisk}
                onChange={(event) =>
                  setPeerReview({
                    ...peerReview,
                    overallRisk: event.target.value,
                  })
                }
                className={inputClass}
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </Field>
            {[
              ["Confidentiality", "confidentiality"],
              ["Integrity", "integrity"],
              ["Availability", "availability"],
            ].map(([label, key]) => (
              <Field key={key} label={`${label} Risk`}>
                <select
                  value={peerReview[key as keyof typeof peerReview]}
                  onChange={(event) =>
                    setPeerReview({
                      ...peerReview,
                      [key]: event.target.value as RiskLevel,
                    })
                  }
                  className={inputClass}
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </Field>
            ))}
            <Field label="Attack Vector / Network">
              <select
                value={peerReview.network}
                onChange={(event) =>
                  setPeerReview({ ...peerReview, network: event.target.value })
                }
                className={inputClass}
              >
                <option>N - Network / Internet</option>
                <option>A - Adjacent / Internal</option>
                <option>L - Local / Indirect access</option>
                <option>P - Physical access</option>
              </select>
            </Field>
            <Field label="Authentication">
              <select
                value={peerReview.authentication}
                onChange={(event) =>
                  setPeerReview({
                    ...peerReview,
                    authentication: event.target.value,
                  })
                }
                className={inputClass}
              >
                <option>M - Multiple Auth</option>
                <option>S - Single Auth</option>
                <option>N - No Auth</option>
              </select>
            </Field>
            <Field label="Target URL">
              <input
                value={peerReview.targetUrl}
                onChange={(event) =>
                  setPeerReview({ ...peerReview, targetUrl: event.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="IP Address">
              <input
                value={peerReview.ipAddress}
                onChange={(event) =>
                  setPeerReview({ ...peerReview, ipAddress: event.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="RBAC Role/s" helper="Comma-separated roles in the app.">
              <input
                value={peerReview.roles}
                onChange={(event) =>
                  setPeerReview({ ...peerReview, roles: event.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="FEAD Word/PDF path">
              <input
                value={peerReview.feadWordFile}
                onChange={(event) =>
                  setPeerReview({
                    ...peerReview,
                    feadWordFile: event.target.value,
                  })
                }
                className={inputClass}
              />
            </Field>
            <Field label="BEAD Word/PDF path">
              <input
                value={peerReview.beadWordFile}
                onChange={(event) =>
                  setPeerReview({
                    ...peerReview,
                    beadWordFile: event.target.value,
                  })
                }
                className={inputClass}
              />
            </Field>
            <Field label="LLM FEAD path">
              <input
                value={peerReview.llmFeadFile}
                onChange={(event) =>
                  setPeerReview({
                    ...peerReview,
                    llmFeadFile: event.target.value,
                  })
                }
                className={inputClass}
              />
            </Field>
            <Field
              label="Scan Reports"
              helper="One report path per line: Qualys, Checkmarx, Mend, AquaSec, Burp, PDF, CSV, XML, etc."
            >
              <textarea
                value={peerReview.scanReports}
                onChange={(event) =>
                  setPeerReview({
                    ...peerReview,
                    scanReports: event.target.value,
                  })
                }
                rows={4}
                className={inputClass}
              />
            </Field>
          </div>
        )}

        {commandType === "create_project" && (
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              ["Project Name", "name"],
              ["Client / Portfolio", "client"],
              ["SPR", "sprId"],
              ["Business Owner", "businessOwner"],
              ["Technical Owner", "technicalOwner"],
              ["Project Manager User ID", "projectManagerId"],
            ].map(([label, key]) => (
              <Field key={key} label={label}>
                <input
                  value={project[key as keyof typeof project]}
                  onChange={(event) =>
                    setProject({ ...project, [key]: event.target.value })
                  }
                  className={inputClass}
                />
              </Field>
            ))}
            <Field label="Risk Tier">
              <select
                value={project.riskTier}
                onChange={(event) =>
                  setProject({ ...project, riskTier: event.target.value })
                }
                className={inputClass}
              >
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </Field>
          </div>
        )}

        {commandType === "create_sr" && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Project ID">
              <input
                value={sr.projectId}
                onChange={(event) =>
                  setSr({ ...sr, projectId: event.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Review Title">
              <input
                value={sr.title}
                onChange={(event) => setSr({ ...sr, title: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="SR">
              <input
                value={sr.srId}
                onChange={(event) => setSr({ ...sr, srId: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Review Type">
              <select
                value={sr.type}
                onChange={(event) => setSr({ ...sr, type: event.target.value })}
                className={inputClass}
              >
                <option>PENTEST</option>
                <option>WEB</option>
                <option>API</option>
                <option>LLM</option>
                <option>MOBILE</option>
                <option>THICK_CLIENT</option>
              </select>
            </Field>
            <Field label="Priority">
              <select
                value={sr.priority}
                onChange={(event) =>
                  setSr({ ...sr, priority: event.target.value })
                }
                className={inputClass}
              >
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </Field>
            <Field label="Status">
              <select
                value={sr.status}
                onChange={(event) => setSr({ ...sr, status: event.target.value })}
                className={inputClass}
              >
                <option>Requested</option>
                <option>Assigned</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
            </Field>
            <Field label="Due Date">
              <input
                type="date"
                value={sr.dueDate}
                onChange={(event) =>
                  setSr({ ...sr, dueDate: event.target.value })
                }
                className={inputClass}
              />
            </Field>
          </div>
        )}

        {commandType === "create_finding" && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Project ID">
              <input
                value={finding.projectId}
                onChange={(event) =>
                  setFinding({ ...finding, projectId: event.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Review ID / SR ID">
              <input
                value={finding.reviewId}
                onChange={(event) =>
                  setFinding({ ...finding, reviewId: event.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Finding Title">
              <input
                value={finding.title}
                onChange={(event) =>
                  setFinding({ ...finding, title: event.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Severity">
              <select
                value={finding.severity}
                onChange={(event) =>
                  setFinding({ ...finding, severity: event.target.value })
                }
                className={inputClass}
              >
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
                <option>Info</option>
              </select>
            </Field>
            <Field label="Status">
              <select
                value={finding.status}
                onChange={(event) =>
                  setFinding({ ...finding, status: event.target.value })
                }
                className={inputClass}
              >
                <option>Open</option>
                <option>In Progress</option>
                <option>Ready for Retest</option>
                <option>Closed</option>
                <option>Exception Requested</option>
              </select>
            </Field>
            <Field label="Source">
              <input
                value={finding.source}
                onChange={(event) =>
                  setFinding({ ...finding, source: event.target.value })
                }
                className={inputClass}
              />
            </Field>
            <div className="lg:col-span-3">
              <Field label="Description">
                <textarea
                  value={finding.description}
                  onChange={(event) =>
                    setFinding({ ...finding, description: event.target.value })
                  }
                  rows={4}
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="lg:col-span-3">
              <Field label="Remediation">
                <textarea
                  value={finding.remediation}
                  onChange={(event) =>
                    setFinding({ ...finding, remediation: event.target.value })
                  }
                  rows={4}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        )}

        {commandType === "create_user" && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Name">
              <input
                value={user.name}
                onChange={(event) => setUser({ ...user, name: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={user.email}
                onChange={(event) => setUser({ ...user, email: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Role">
              <select
                value={user.role}
                onChange={(event) => setUser({ ...user, role: event.target.value })}
                className={inputClass}
              >
                <option>ADMIN</option>
                <option>GOVERNANCE_TEAM</option>
                <option>EXECUTIVE</option>
                <option>QA_REVIEWER</option>
                <option>REVIEWER</option>
                <option>PROJECT_MANAGER</option>
                <option>ENGAGEMENT_MANAGER</option>
                <option>CONSULTANT</option>
              </select>
            </Field>
            <Field label="Temporary Password" helper="Optional. Leave blank if account setup happens later.">
              <input
                type="password"
                value={user.password}
                onChange={(event) =>
                  setUser({ ...user, password: event.target.value })
                }
                className={inputClass}
              />
            </Field>
          </div>
        )}

        {showJson && (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-black/30 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-200">
              <Code2 size={16} />
              Generated JSON preview
            </div>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-300">
              {jsonPreview}
            </pre>
          </div>
        )}
      </div>

      <button
        onClick={run}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
      >
        {loading ? <Loader2 className="animate-spin" size={16} /> : <Terminal size={16} />}
        Run Agent Command
      </button>

      {result && (
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-200">
            <PlusCircle size={16} />
            Command result
          </div>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-sm text-slate-200">
            {result}
          </pre>
        </div>
      )}
    </section>
  );
}
