"use client";

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  FileSearch,
  Loader2,
  Plus,
  Upload,
} from "lucide-react";
import { useState } from "react";

type PeerReviewResult = {
  ok: boolean;
  mode: string;
  artifacts: {
    name: string;
    type: string;
    size: number;
    characters: number;
  }[];
  applicableControlCount: number;
  analysis: string;
  error?: string;
};

const scopes = [
  "Web only",
  "Web + LLM",
  "API",
  "LLM only",
  "Thick Client",
];

const riskLevels = ["High", "Medium", "Low"];
const scanTypes = [
  "Burp Suite",
  "Qualys",
  "Checkmarx",
  "Mend",
  "AquaSec",
  "Manual Evidence",
  "Other",
];

export default function PeerReviewAgent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] =
    useState<PeerReviewResult | null>(null);
  const [scanSlots, setScanSlots] = useState([0]);
  const [grcRisk, setGrcRisk] = useState("High");
  const [agentRisk, setAgentRisk] = useState("Medium");
  const [riskConfirmed, setRiskConfirmed] = useState(false);
  const riskMismatch = grcRisk !== agentRisk;

  async function submit(formData: FormData) {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/agent/peer-review", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as PeerReviewResult;
      setResult(data);
    } catch (error) {
      setResult({
        ok: false,
        mode: "client-error",
        artifacts: [],
        applicableControlCount: 0,
        analysis: "",
        error:
          error instanceof Error
            ? error.message
            : "Unable to run peer review agent",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/20">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-200">
            <FileSearch size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
              Peer Review Agent
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Review pentest artifact and scan report
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Upload FEAD, BEAD, LLM FEAD, and categorized scan reports. The
              agent cross-checks scope, risk, URL/IP context, RBAC roles, and
              control coverage to identify missed testing, weak evidence, and
              findings that need reviewer follow-up.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
          <Bot className="mr-2 inline" size={16} />
          Uses local/tunneled AI when available
        </div>
      </div>

      <form action={submit} className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SelectField name="scope" label="Scope" options={scopes} />
          <SelectField
            name="typeOfReview"
            label="Type of Review"
            options={["FULL", "Enhancement"]}
          />
          <SelectField
            name="typeOfApplication"
            label="Application Type"
            options={["Internal", "Intranet", "Internet"]}
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
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TextField
            name="referencePackage"
            label="SPR"
            placeholder="SPR-18984"
          />
          <TextField
            name="reviewRecord"
            label="SR"
            placeholder="SR / review identifier"
          />
          <TextField
            name="targetUrl"
            label="Testing App URL"
            placeholder="https://app.example.com"
          />
          <TextField
            name="ipAddress"
            label="IP Address"
            placeholder="10.84.115.5"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SelectField
            name="overallRisk"
            label="Overall Risk"
            options={riskLevels}
          />
          {[
            ["confidentiality", "Confidentiality Risk"],
            ["integrity", "Integrity Risk"],
            ["availability", "Availability Risk"],
          ].map(([name, label]) => (
            <SelectField
              key={name}
              name={name}
              label={label}
              options={riskLevels}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-4">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                <AlertTriangle size={16} />
                Risk Profile Validation
              </span>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Peer reviewer confirms the final risk profile when GRC and the
                Demo Call Agent recommendation do not match.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                riskMismatch
                  ? "bg-red-500/10 text-red-200"
                  : "bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {riskMismatch ? "Mismatch" : "Aligned"}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label>
              <span className="mb-2 block text-sm text-slate-400">
                GRC risk profile
              </span>
              <select
                name="grcRiskProfile"
                value={grcRisk}
                onChange={(event) => setGrcRisk(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
              >
                {riskLevels.map((risk) => (
                  <option key={risk}>{risk}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm text-slate-400">
                Agent-suggested risk profile
              </span>
              <select
                name="agentSuggestedRiskProfile"
                value={agentRisk}
                onChange={(event) => setAgentRisk(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
              >
                {riskLevels.map((risk) => (
                  <option key={risk}>{risk}</option>
                ))}
              </select>
            </label>
            <label className="flex items-end gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
              <input
                name="riskProfileConfirmed"
                type="checkbox"
                checked={riskConfirmed}
                onChange={(event) => setRiskConfirmed(event.target.checked)}
                className="mb-1 accent-cyan-400"
              />
              Confirm final risk profile after peer review
            </label>
          </div>
          {riskMismatch && !riskConfirmed && (
            <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">
              Mismatch requires peer reviewer confirmation and a comment before
              governance validation.
            </p>
          )}
          <textarea
            name="riskValidationComment"
            rows={3}
            placeholder="Explain whether GRC or Demo Call Agent risk is accepted, and why."
            className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            name="authentication"
            label="Au - Authentication"
            options={[
              "M - Multiple authentication",
              "S - Single authentication",
              "N - No authentication",
            ]}
          />
          <TextField
            name="roles"
            label="Role/s - RBAC roles in app"
            placeholder="Admin, Entitlement User, Reviewer, Regular User"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["feadFile", "FEAD Word/PDF"],
            ["beadFile", "BEAD Word/PDF"],
            ["llmFeadFile", "LLM FEAD Word/PDF"],
          ].map(([name, label]) => (
            <FileField key={name} name={name} label={label} />
          ))}
        </div>

        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Upload size={16} className="text-cyan-300" />
                Scan Reports
              </span>
              <p className="mt-2 text-xs text-slate-500">
                Select the report type for each upload so Atomix can sort
                Qualys, Checkmarx, Mend, AquaSec, Burp, and manual evidence.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setScanSlots((current) => [...current, Date.now()])
              }
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 px-3 py-2 text-xs font-bold text-cyan-200"
            >
              <Plus size={14} />
              Add scan report
            </button>
          </div>

          <div className="grid gap-3">
            {scanSlots.map((slot, index) => (
              <div
                key={slot}
                className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3 md:grid-cols-[220px_1fr]"
              >
                <select
                  name="scanTypes"
                  defaultValue={scanTypes[Math.min(index, scanTypes.length - 1)]}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
                >
                  {scanTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
                <input
                  name="scanFiles"
                  type="file"
                  accept=".docx,.pdf,.txt,.md,.csv,.json,.xml"
                  className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-bold file:text-slate-950"
                />
              </div>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-400">
            Reviewer Notes
          </span>
          <textarea
            name="notes"
            rows={4}
            placeholder="Mention constraints, controls marked N/A, RBAC notes, auth details, architecture assumptions, or areas where you want a second look."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
          />
        </label>

        <button
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 md:w-fit"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          Run Peer Review Agent
        </button>
      </form>

      {result && (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
          {result.ok ? (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-cyan-400/10 px-3 py-1 font-semibold text-cyan-200">
                  Mode: {result.mode}
                </span>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                  Controls: {result.applicableControlCount}
                </span>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                  Artifacts: {result.artifacts.length}
                </span>
              </div>
              <div className="mb-4 grid gap-2 md:grid-cols-2">
                {result.artifacts.map((artifact) => (
                  <div
                    key={artifact.name}
                    className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm"
                  >
                    <p className="font-semibold text-white">
                      {artifact.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {artifact.type} · {artifact.characters} chars extracted
                    </p>
                  </div>
                ))}
              </div>
              <pre className="max-h-[34rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-black/60 p-4 text-sm leading-6 text-slate-200">
                {result.analysis}
              </pre>
            </>
          ) : (
            <p className="text-sm text-red-200">
              {result.error ?? "Peer review failed"}
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
  placeholder: string;
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

function FileField({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  return (
    <label className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 p-4">
      <span className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Upload size={16} className="text-cyan-300" />
        {label}
      </span>
      <input
        name={name}
        type="file"
        accept=".docx,.pdf,.txt,.md,.csv,.json,.xml"
        className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-bold file:text-slate-950"
      />
    </label>
  );
}
