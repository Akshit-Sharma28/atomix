"use client";

import {
  ClipboardCheck,
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
    link.download = "atomix-pre-review-scope.md";
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
              Scope Call Agent
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Generate pre-review scope document
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Capture demo-call notes, target details, risk context, scan
              expectations, RBAC, tech stack, environment access, and
              architecture assumptions before the information security review
              starts.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-100">
          <Sparkles className="mr-2 inline" size={16} />
          Creates final scope handoff
        </div>
      </div>

      <form action={submit} className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TextField name="projectName" label="Project Name" />
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
            label="Role/s"
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
            options={["Internal", "Intranet", "Internet"]}
          />
          <SelectField
            name="authentication"
            label="Au - Authentication"
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
          />
          <SelectField
            name="confidentiality"
            label="Confidentiality"
            options={riskLevels}
          />
          <SelectField
            name="integrity"
            label="Integrity"
            options={riskLevels}
          />
          <SelectField
            name="availability"
            label="Availability"
            options={riskLevels}
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
          <TextField name="multiTenant" label="Multi-tenant / Single-tenant" />
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

        <button
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-300 px-5 py-4 font-black text-slate-950 transition hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-60 md:w-fit"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <ClipboardCheck size={18} />
          )}
          Generate Scope Document
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
}: {
  name: string;
  label: string;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-400">
        {label}
      </span>
      <select
        name={name}
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
