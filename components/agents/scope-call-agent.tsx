"use client";

import {
  AlertTriangle,
  ClipboardCheck,
  Copy,
  Download,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

type ScopeResult = {
  ok: boolean;
  mode: string;
  document: string;
  error?: string;
};

const riskLevels = ["High", "Medium", "Low"];
const tenantTypes = ["Single tenant", "Multi tenant"];
const scanReports = [
  "Burp Suite",
  "Qualys",
  "Checkmarx",
  "Mend",
  "AquaSec",
  "LLM FEAD",
  "Manual Evidence",
];

export default function ScopeCallAgent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScopeResult | null>(null);
  const [overallRisk, setOverallRisk] = useState("High");
  const [confidentiality, setConfidentiality] = useState("High");
  const [integrity, setIntegrity] = useState("High");
  const [availability, setAvailability] = useState("High");
  const [tenantType, setTenantType] = useState("Single tenant");
  const [publicInternal, setPublicInternal] = useState("Internal");
  const [internetExposed, setInternetExposed] = useState("No");
  const [apiAvailable, setApiAvailable] = useState("Yes");
  const [llmUsage, setLlmUsage] = useState("No");
  const permutation = validateRiskPermutation(
    overallRisk,
    confidentiality,
    integrity,
    availability,
  );
  const allowedPermutations = generateAllowedPermutations(overallRisk);
  const feadDraft = generateFeadDraft({
    tenantType,
    publicInternal,
    internetExposed,
    apiAvailable,
    llmUsage,
  });

  async function submit(formData: FormData) {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/agent/scope-document", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as ScopeResult;
      setResult(data);
    } catch (error) {
      setResult({
        ok: false,
        mode: "client-error",
        document: "",
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate scope document",
      });
    } finally {
      setLoading(false);
    }
  }

  function downloadDocument() {
    if (!result?.document) {
      return;
    }

    const blob = new Blob([result.document], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "atomix-demo-call-intake.md";
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadFeadDraft() {
    const blob = new Blob([feadDraft], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "atomix-customized-fead-draft.md";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="mt-8 rounded-3xl border border-purple-500/20 bg-purple-500/[0.04] p-6 shadow-2xl shadow-purple-950/20">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-400/15 text-purple-200">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-purple-300">
              Demo Call Agent
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Capture application intake and generate FEAD draft
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Capture application details, GRC risk, agent-suggested risk,
              tenant context, integrations, and repeatable FEAD control
              decisions before the information security review starts.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-100">
          <Sparkles className="mr-2 inline" size={16} />
          Creates intake and FEAD handoff
        </div>
      </div>

      <form action={submit} className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TextField name="projectName" label="Project Name" />
          <TextField name="applicationName" label="Application Name" />
          <TextField name="businessOwner" label="Business Owner" />
          <TextField name="numberOfRoles" label="Number of Roles" />
          <TextField name="spr" label="SPR" />
          <TextField name="sr" label="SR" />
          <TextField name="chargeCode" label="Charge Code" />
          <TextField name="targetUrl" label="URL" />
          <TextField name="ipAddress" label="IP Address" />
          <TextField
            name="hostDetails"
            label="Host / Machine Name"
          />
          <TextField
            name="roles"
            label="Role Names and Descriptions"
            placeholder="Admin, entitlement user, regular user"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SelectField
            name="scope"
            label="Scope"
            options={[
              "Web only",
              "Web + LLM",
              "API",
              "LLM only",
              "Thick Client",
            ]}
          />
          <SelectField
            name="typeOfReview"
            label="Type of Review"
            options={["FULL", "Enhancement", "Partial Review"]}
          />
          <SelectField
            name="typeOfApplication"
            label="Application Type"
            options={["Internal", "Public", "Intranet", "Internet"]}
          />
          <SelectField
            name="authentication"
            label="Authentication Type"
            options={[
              "M - Multiple authentication",
              "S - Single authentication",
              "N - No authentication",
            ]}
          />
          <SelectField
            name="overallRisk"
            label="Overall Risk"
            options={riskLevels}
            value={overallRisk}
            onChange={setOverallRisk}
          />
          <SelectField
            name="confidentiality"
            label="Confidentiality"
            options={riskLevels}
            value={confidentiality}
            onChange={setConfidentiality}
          />
          <SelectField
            name="integrity"
            label="Integrity"
            options={riskLevels}
            value={integrity}
            onChange={setIntegrity}
          />
          <SelectField
            name="availability"
            label="Availability"
            options={riskLevels}
            value={availability}
            onChange={setAvailability}
          />
          <SelectField
            name="tenantType"
            label="Tenant Type"
            options={tenantTypes}
            value={tenantType}
            onChange={setTenantType}
          />
          <SelectField
            name="dataClassification"
            label="Data Classification"
            options={["Public", "Internal", "Confidential", "Restricted"]}
          />
          <SelectField
            name="publicInternal"
            label="Public/Internal Application"
            options={["Internal", "Public"]}
            value={publicInternal}
            onChange={setPublicInternal}
          />
          <SelectField
            name="internetExposed"
            label="Internet Exposed"
            options={["No", "Yes"]}
            value={internetExposed}
            onChange={setInternetExposed}
          />
          <SelectField
            name="apisAvailable"
            label="APIs Available"
            options={["Yes", "No", "To be confirmed"]}
            value={apiAvailable}
            onChange={setApiAvailable}
          />
          <SelectField
            name="llmUsage"
            label="LLM/AI Usage"
            options={["No", "Yes", "To be confirmed"]}
            value={llmUsage}
            onChange={setLlmUsage}
          />
          <TextField name="externalIntegrations" label="External Integrations" />
          <SelectField
            name="grcRiskProfile"
            label="GRC Risk Profile"
            options={riskLevels}
          />
          <SelectField
            name="agentSuggestedRiskProfile"
            label="Agent-Suggested Risk Profile"
            options={riskLevels}
            value={overallRisk}
            onChange={setOverallRisk}
          />
          <SelectField
            name="network"
            label="AV - Attack Vector"
            options={[
              "N - Network / Internet",
              "A - Adjacent / Internal",
              "L - Local / Indirect access",
              "P - Physical access",
            ]}
          />
          <SelectField
            name="beadRequired"
            label="BEAD Required"
            options={["Yes", "No", "To be confirmed"]}
          />
          <SelectField
            name="llmReviewRequired"
            label="LLM FEAD Required"
            options={["Yes", "No", "To be confirmed"]}
          />
          <SelectField
            name="previousReportAttached"
            label="Previous Report Attached"
            options={["Yes", "No", "Not applicable"]}
          />
        </div>

        <div
          className={`rounded-2xl border p-4 ${
            permutation.valid
              ? "border-emerald-500/20 bg-emerald-500/[0.04]"
              : "border-red-500/20 bg-red-500/[0.06]"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                <AlertTriangle size={16} className="text-amber-300" />
                Archer-Based Risk Permutation Engine
              </span>
              <p className="mt-2 max-w-4xl text-xs leading-5 text-slate-400">
                Configurable demo logic checks whether the selected CIA values
                are valid for the overall risk profile before peer validation.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                permutation.valid
                  ? "bg-emerald-500/10 text-emerald-200"
                  : "bg-red-500/10 text-red-200"
              }`}
            >
              {permutation.valid ? "Valid permutation" : "Invalid permutation"}
            </span>
          </div>
          <p className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
            {permutation.message}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {allowedPermutations.slice(0, 8).map((item) => (
              <span
                key={item}
                className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-200">
            Scan reports in scope
          </p>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
            {scanReports.map((scan) => (
              <label
                key={scan}
                className="flex items-center gap-2 rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-300"
              >
                <input
                  name="scanReports"
                  type="checkbox"
                  value={scan}
                  className="accent-cyan-400"
                />
                {scan}
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <TextField name="database" label="Database and Version" />
          <TextField name="appServer" label="Application Server" />
          <TextField name="operatingSystem" label="Operating System" />
          <TextField name="apiStyle" label="API Usage" placeholder="REST, GraphQL, SOAP" />
          <TextField name="authMechanism" label="Auth Mechanism" placeholder="SSO, OAuth, JWT, LDAP" />
          <TextField name="cloudServices" label="Cloud Services" placeholder="AWS, Azure, GCP" />
          <TextField name="identityIntegration" label="AD / SSO Integrated" />
          <TextField name="multiTenant" label="Tenant Architecture Notes" />
          <TextField name="credentials" label="Credentials Needed" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <TextField name="fileUpload" label="File Upload Present" />
          <TextField name="emailFunctions" label="Forms-based Email Functions" />
          <TextField name="viewState" label="View-state / Client State" />
          <TextField name="challengeResponse" label="Challenge / CAPTCHA / OTP" />
          <TextField name="sessionManagement" label="Session Cookie or Token" />
          <TextField name="tokenDetails" label="JWT / Token Details" />
          <TextField name="sensitiveData" label="Sensitive Data Processed" />
          <TextField name="environmentReadiness" label="Environment Readiness" />
          <TextField name="architectureNotes" label="Information Architecture Notes" />
        </div>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-400">
            Demo Call Notes
          </span>
          <textarea
            name="demoNotes"
            rows={5}
            placeholder="Paste notes from the app-team demo call: flows shown, roles tested, data handled, exceptions, access blockers, test dates, or scope uncertainty."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
          />
        </label>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="text-sm font-semibold text-cyan-200">
                Automated FEAD from Demo Call Data
              </span>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Applicable controls remain open for reviewer input. Controls
                made not applicable by intake facts are prefilled with status
                and comments.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(feadDraft)}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 px-3 py-2 text-xs font-bold text-cyan-200"
              >
                <Copy size={14} />
                Copy
              </button>
              <button
                type="button"
                onClick={downloadFeadDraft}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 px-3 py-2 text-xs font-bold text-cyan-200"
              >
                <Download size={14} />
                Download
              </button>
            </div>
          </div>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-black/50 p-4 text-xs leading-5 text-slate-300">
            {feadDraft}
          </pre>
        </div>

        <button
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-300 px-5 py-4 font-black text-slate-950 transition hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-60 md:w-fit"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <ClipboardCheck size={18} />
          )}
          Generate Demo Call Handoff
        </button>
      </form>

      {result && (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
          {result.ok ? (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-purple-400/10 px-3 py-1 text-sm font-semibold text-purple-200">
                  Mode: {result.mode}
                </span>
                <button
                  type="button"
                  onClick={downloadDocument}
                  className="inline-flex items-center gap-2 rounded-xl border border-purple-400/30 px-3 py-2 text-sm font-bold text-purple-200"
                >
                  <Download size={16} />
                  Download Markdown
                </button>
              </div>
              <pre className="max-h-[34rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-black/60 p-4 text-sm leading-6 text-slate-200">
                {result.document}
              </pre>
            </>
          ) : (
            <p className="text-sm text-red-200">
              {result.error ?? "Scope document generation failed"}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function SelectField({
  name,
  label,
  options,
  value,
  onChange,
}: {
  name: string;
  label: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-400">
        {label}
      </span>
      <select
        name={name}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  name,
  label,
  placeholder,
}: {
  name: string;
  label: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-400">
        {label}
      </span>
      <input
        name={name}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
      />
    </label>
  );
}

function validateRiskPermutation(
  overallRisk: string,
  confidentiality: string,
  integrity: string,
  availability: string,
) {
  const cia = [confidentiality, integrity, availability];

  if (overallRisk === "High" && cia.every((value) => value === "High")) {
    return {
      valid: false,
      message:
        "Overall Risk is High, but C/I/A are all High. Mark an exception or reduce one CIA dimension after peer validation.",
    };
  }

  if (
    overallRisk === "High" &&
    integrity !== "High" &&
    availability !== "High"
  ) {
    return {
      valid: false,
      message:
        "Overall Risk is High, but both Integrity and Availability are unrestricted. At least one should remain High or require validation.",
    };
  }

  if (overallRisk === "Low" && cia.includes("High")) {
    return {
      valid: false,
      message:
        "Overall Risk is Low cannot include a High CIA dimension without governance override.",
    };
  }

  return {
    valid: true,
    message:
      "Selected CIA permutation is allowed for the current overall risk profile.",
  };
}

function generateAllowedPermutations(overallRisk: string) {
  const combinations: string[] = [];

  for (const confidentiality of riskLevels) {
    for (const integrity of riskLevels) {
      for (const availability of riskLevels) {
        const result = validateRiskPermutation(
          overallRisk,
          confidentiality,
          integrity,
          availability,
        );

        if (result.valid) {
          combinations.push(
            `C:${confidentiality} I:${integrity} A:${availability}`,
          );
        }
      }
    }
  }

  return combinations;
}

function generateFeadDraft({
  tenantType,
  publicInternal,
  internetExposed,
  apiAvailable,
  llmUsage,
}: {
  tenantType: string;
  publicInternal: string;
  internetExposed: string;
  apiAvailable: string;
  llmUsage: string;
}) {
  const controls = [
    {
      id: "7.2",
      title: "Multi-tenant isolation",
      status: tenantType === "Single tenant" ? "NA" : "Open",
      comment:
        tenantType === "Single tenant"
          ? "Application is deployed as a single tenant solution; multi-tenant isolation controls are not applicable."
          : "Reviewer to validate tenant isolation boundaries, data segregation, and tenant-aware authorization.",
    },
    {
      id: "4.1",
      title: "Internet exposure controls",
      status: internetExposed === "No" && publicInternal === "Internal" ? "NA" : "Open",
      comment:
        internetExposed === "No" && publicInternal === "Internal"
          ? "Application is internal and not internet exposed; public edge hardening controls are not applicable."
          : "Reviewer to validate external exposure, edge controls, WAF, TLS, and unauthenticated attack surface.",
    },
    {
      id: "9.4",
      title: "API security review",
      status: apiAvailable === "No" ? "NA" : "Open",
      comment:
        apiAvailable === "No"
          ? "Application intake indicates no available APIs; API-specific FEAD controls are not applicable."
          : "Reviewer to validate API authentication, authorization, schema validation, rate limits, and logging.",
    },
    {
      id: "12.8",
      title: "LLM/AI usage controls",
      status: llmUsage === "No" ? "NA" : "Open",
      comment:
        llmUsage === "No"
          ? "Application does not use LLM/AI features; LLM FEAD controls are not applicable."
          : "Reviewer to validate prompt injection, data leakage, model access, output handling, and abuse monitoring.",
    },
  ];

  return `# Customized FEAD Draft

## Intake Drivers
- Tenant type: ${tenantType}
- Public/internal application: ${publicInternal}
- Internet exposed: ${internetExposed}
- APIs available: ${apiAvailable}
- LLM/AI usage: ${llmUsage}

## Control Status
${controls
  .map(
    (control) =>
      `- ${control.id} ${control.title}: ${control.status}\n  Comment: ${control.comment}`,
  )
  .join("\n")}

## Reviewer Input Still Needed
- Confirm authentication and RBAC evidence.
- Confirm applicable data protection controls.
- Confirm scan reports and manual testing evidence.
- Confirm peer reviewer risk profile validation outcome.
`;
}
