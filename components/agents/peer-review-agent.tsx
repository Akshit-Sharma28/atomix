"use client";

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Download,
  FileCheck2,
  FileSearch,
  Loader2,
  Plus,
  Upload,
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
  WidthType as DocxWidthType,
} from "docx";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type PeerReviewResult = {
  ok: boolean;
  mode: string;
  artifacts: {
    name: string;
    type: string;
    size: number;
    characters: number;
  }[];
  processingInsights?: {
    uploadBytes: number;
    uploadLimitBytes: number;
    extractedCharacters: number;
    estimatedExtractedTokens: number;
    artifactChunks: number;
    chunkSizeCharacters: number;
    vectorDbUsed: boolean;
    promptCharacters: number;
    estimatedPromptTokens: number;
    excerptLimitPerArtifactCharacters: number;
    aiTimeoutMs: number;
    aiElapsedMs: number;
    aiStatusDetail: string;
    outputTokenBudget: number;
  };
  applicableControlCount: number;
  analysis: string;
  scope?: string;
  typeOfReview?: string;
  referencePackage?: string;
  reviewRecord?: string;
  targetUrl?: string;
  ipAddress?: string;
  roles?: string;
  authentication?: string;
  overallRisk?: string;
  grcRiskProfile?: string;
  agentSuggestedRiskProfile?: string;
  riskProfileConfirmed?: boolean;
  typeOfApplication?: string;
  risk?: {
    confidentiality: string;
    integrity: string;
    availability: string;
  };
  network?: string;
  scanInventory?: string[];
  error?: string;
};

type SelectedArtifact = {
  name: string;
  size: number;
};

type ProgressStep = {
  label: string;
  detail: string;
};

const scopes = [
  "Web only",
  "Web + LLM",
  "API",
  "LLM only",
  "Thick Client",
];

const riskLevels = ["High", "Medium", "Low"];
const riskScore: Record<string, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
};
const scanTypes = [
  "Burp Suite",
  "Qualys",
  "Checkmarx",
  "Mend",
  "AquaSec",
  "Manual Evidence",
  "Other",
];
const maxPeerReviewUploadBytes = 4 * 1024 * 1024;
const progressByStep = [12, 30, 50, 72, 88];

const reviewProgressSteps: ProgressStep[] = [
  {
    label: "Uploading artifacts",
    detail: "Sending FEAD, BEAD, LLM FEAD, and scan reports to Atomix.",
  },
  {
    label: "Extracting evidence",
    detail: "Reading document text and scanner evidence for control mapping.",
  },
  {
    label: "Mapping controls",
    detail: "Syncing FEAD evidence against the active peer review control library.",
  },
  {
    label: "Running local AI",
    detail: "Waiting for local AI. If it is slow, Atomix falls back to deterministic control coverage.",
  },
  {
    label: "Preparing decision",
    detail: "Packaging reviewer comments, gaps, and governance follow-up items.",
  },
];

function recommendedRiskFromCia(
  overallRisk: string,
  confidentiality: string,
  integrity: string,
  availability: string,
) {
  const highestCia = [confidentiality, integrity, availability].reduce(
    (highest, current) =>
      riskScore[current] > riskScore[highest] ? current : highest,
    "Low",
  );

  return riskScore[overallRisk] >= riskScore[highestCia]
    ? overallRisk
    : highestCia;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function estimateTokens(characters: number) {
  return Math.ceil(characters / 4);
}

function estimateClientReviewSeconds(bytes: number, count: number) {
  const mb = bytes / (1024 * 1024);
  return Math.max(35, Math.ceil(35 + mb * 12 + count * 8));
}

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "atomix";
}

export default function PeerReviewAgent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] =
    useState<PeerReviewResult | null>(null);
  const [scanSlots, setScanSlots] = useState([0]);
  const [overallRisk, setOverallRisk] = useState("High");
  const [confidentiality, setConfidentiality] = useState("High");
  const [integrity, setIntegrity] = useState("High");
  const [availability, setAvailability] = useState("High");
  const [grcRisk, setGrcRisk] = useState("High");
  const [agentRisk, setAgentRisk] = useState("High");
  const [agentRiskOverridden, setAgentRiskOverridden] = useState(false);
  const [riskConfirmed, setRiskConfirmed] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [selectedArtifacts, setSelectedArtifacts] = useState<
    Record<string, SelectedArtifact>
  >({});
  const selectedArtifactList = Object.values(selectedArtifacts);
  const selectedArtifactCount = selectedArtifactList.length;
  const selectedArtifactBytes = selectedArtifactList.reduce(
    (total, artifact) => total + artifact.size,
    0,
  );
  const estimatedReviewSeconds = estimateClientReviewSeconds(
    selectedArtifactBytes,
    selectedArtifactCount,
  );
  const recommendedRisk = useMemo(
    () =>
      recommendedRiskFromCia(
        overallRisk,
        confidentiality,
        integrity,
        availability,
      ),
    [overallRisk, confidentiality, integrity, availability],
  );
  const displayedAgentRisk =
    agentRiskOverridden ? agentRisk : recommendedRisk;
  const riskMismatch = grcRisk !== displayedAgentRisk;
  const progressPercent = loading
    ? progressByStep[progressStep]
    : result?.ok
      ? 100
      : 0;

  useEffect(() => {
    if (!loading) {
      return;
    }

    const interval = window.setInterval(() => {
      setProgressStep((current) =>
        Math.min(current + 1, reviewProgressSteps.length - 1),
      );
    }, 2500);

    return () => {
      window.clearInterval(interval);
    };
  }, [loading]);

  async function submit(formData: FormData) {
    const uploadedFiles = [
      formData.get("feadFile"),
      formData.get("beadFile"),
      formData.get("llmFeadFile"),
      ...formData.getAll("scanFiles"),
    ].filter((item): item is File => item instanceof File && item.size > 0);
    const uploadCount = uploadedFiles.length;
    const uploadBytes = uploadedFiles.reduce((total, file) => total + file.size, 0);

    setLoading(true);
    setResult(null);
    setProgressStep(0);

    if (uploadCount === 0) {
      setResult({
        ok: false,
        mode: "client-validation",
        artifacts: [],
        applicableControlCount: 0,
        analysis: "",
        error:
          "Select at least one FEAD, BEAD, LLM FEAD, or scan report before running the peer review agent.",
      });
      setLoading(false);
      return;
    }

    if (uploadBytes > maxPeerReviewUploadBytes) {
      setResult({
        ok: false,
        mode: "client-validation",
        artifacts: [],
        applicableControlCount: 0,
        analysis: "",
        error: `Selected files total ${formatBytes(uploadBytes)}. The current serverless peer review route supports up to ${formatBytes(maxPeerReviewUploadBytes)} per run. Please upload a smaller FEAD/BEAD extract or one artifact at a time.`,
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/agent/peer-review", {
        method: "POST",
        body: formData,
      });
      const responseText = await response.text();
      let data: Partial<PeerReviewResult> = {};

      try {
        data = JSON.parse(responseText) as Partial<PeerReviewResult>;
      } catch {
        data = {
          error: responseText.includes("<!DOCTYPE")
            ? "Peer review API returned an HTML error page instead of JSON. This usually means the session expired, Vercel rejected the upload size, or the serverless function timed out before returning JSON."
            : responseText || "Peer review API returned a non-JSON response.",
        };
      }

      setResult({
        mode: data.mode ?? "api-error",
        artifacts: data.artifacts ?? [],
        processingInsights: data.processingInsights,
        applicableControlCount: data.applicableControlCount ?? 0,
        analysis: data.analysis ?? "",
        scope: data.scope,
        typeOfReview: data.typeOfReview,
        referencePackage: data.referencePackage,
        reviewRecord: data.reviewRecord,
        targetUrl: data.targetUrl,
        ipAddress: data.ipAddress,
        roles: data.roles,
        authentication: data.authentication,
        overallRisk: data.overallRisk,
        grcRiskProfile: data.grcRiskProfile,
        agentSuggestedRiskProfile: data.agentSuggestedRiskProfile,
        riskProfileConfirmed: data.riskProfileConfirmed,
        typeOfApplication: data.typeOfApplication,
        risk: data.risk,
        network: data.network,
        scanInventory: data.scanInventory,
        ok: Boolean(response.ok && data.ok),
        error:
          response.ok || data.error
            ? data.error
            : `Peer review agent failed with HTTP ${response.status}.`,
      });
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(new FormData(event.currentTarget));
  }

  async function downloadPeerReviewReport() {
    if (!result?.ok || !result.analysis) {
      return;
    }

    const blob = await buildPeerReviewDocx(result);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFilename(result.referencePackage || "atomix-peer-review")}-peer-review-report.docx`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const uploadStatusPanel = (
    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-cyan-100">
            <FileCheck2 size={16} />
            Upload status
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {selectedArtifactCount > 0
              ? `${selectedArtifactCount} artifact${selectedArtifactCount === 1 ? "" : "s"} selected (${formatBytes(selectedArtifactBytes)}). Estimated review window: ${estimatedReviewSeconds}-${estimatedReviewSeconds + 35}s.`
              : "Select at least one FEAD, BEAD, LLM FEAD, or scan report."}
            {" "}Current serverless limit:{" "}
            {formatBytes(maxPeerReviewUploadBytes)} per run.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            selectedArtifactCount > 0
              ? "bg-emerald-400/10 text-emerald-200"
              : "bg-slate-950 text-slate-400"
          }`}
        >
          {selectedArtifactCount > 0 ? "Files ready" : "Waiting for file"}
        </span>
      </div>
      {selectedArtifactCount > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(selectedArtifacts)
            .map(([key, artifact]) => (
              <span
                key={key}
                className="rounded-full border border-cyan-400/20 bg-slate-950 px-3 py-1 text-xs text-cyan-100"
              >
                {artifact.name} · {formatBytes(artifact.size)}
              </span>
            ))}
        </div>
      )}
      {selectedArtifactCount > 0 && (
        <div className="mt-3 grid gap-2 text-xs md:grid-cols-4">
          <InsightPill
            label="Upload size"
            value={`${formatBytes(selectedArtifactBytes)} / ${formatBytes(maxPeerReviewUploadBytes)}`}
          />
          <InsightPill
            label="Rough input tokens"
            value={`~${formatNumber(estimateTokens(selectedArtifactBytes))}`}
          />
          <InsightPill
            label="LLM timeout"
            value="45s safe window"
          />
          <InsightPill
            label="Vector DB"
            value="Not used in peer review"
          />
        </div>
      )}
    </div>
  );

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

      <form onSubmit={handleSubmit} className="grid gap-5">
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
            value={overallRisk}
            onChange={(value) => {
              setOverallRisk(value);
              setGrcRisk(value);
              setAgentRiskOverridden(false);
              setRiskConfirmed(false);
            }}
          />
          <SelectField
            name="confidentiality"
            label="Confidentiality Risk"
            options={riskLevels}
            value={confidentiality}
            onChange={setConfidentiality}
          />
          <SelectField
            name="integrity"
            label="Integrity Risk"
            options={riskLevels}
            value={integrity}
            onChange={setIntegrity}
          />
          <SelectField
            name="availability"
            label="Availability Risk"
            options={riskLevels}
            value={availability}
            onChange={setAvailability}
          />
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
                value={displayedAgentRisk}
                onChange={(event) => {
                  setAgentRisk(event.target.value);
                  setAgentRiskOverridden(true);
                  setRiskConfirmed(false);
                }}
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
          {!riskMismatch && (
            <p className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              Overall {overallRisk} with CIA C:{confidentiality} I:{integrity} A:
              {availability} is accepted for peer review.
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
            <FileField
              key={name}
              name={name}
              label={label}
              artifact={selectedArtifacts[name] ?? null}
              onFileChange={(artifact) =>
                setSelectedArtifacts((current) => {
                  const next = { ...current };

                  if (artifact) {
                    next[name] = artifact;
                  } else {
                    delete next[name];
                  }

                  return next;
                })
              }
            />
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
                  onChange={(event) =>
                    setSelectedArtifacts((current) => ({
                      ...current,
                      ...(event.target.files?.[0]
                        ? {
                            [`scan-${slot}`]: {
                              name: event.target.files[0].name,
                              size: event.target.files[0].size,
                            },
                          }
                        : {}),
                    }))
                  }
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

        {uploadStatusPanel}

        {(loading || result) && (
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-cyan-100">
                  {loading
                    ? reviewProgressSteps[progressStep].label
                    : result?.ok
                      ? "Peer review complete"
                      : "Peer review stopped"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {loading
                    ? reviewProgressSteps[progressStep].detail
                    : result?.ok
                      ? "FEAD review comments and control coverage are ready."
                      : result?.error ?? "Review could not complete."}
                </p>
              </div>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-cyan-200">
                {progressPercent}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-950">
              <div
                className="h-full rounded-full bg-cyan-300 transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                }}
              />
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-5">
              {reviewProgressSteps.map((step, index) => (
                <div
                  key={step.label}
                  className={`rounded-xl border px-3 py-2 text-xs ${
                    index <= progressStep || result?.ok
                      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
                      : "border-slate-800 bg-slate-950 text-slate-500"
                  }`}
                >
                  {step.label}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 md:w-fit"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          {loading ? "Running Peer Review Agent" : "Run Peer Review Agent"}
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
                <button
                  type="button"
                  onClick={downloadPeerReviewReport}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 px-3 py-1 font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
                >
                  <Download size={14} />
                  Download peer review report
                </button>
              </div>
              {result.processingInsights && (
                <div className="mb-4 grid gap-2 md:grid-cols-4">
                  <InsightPill
                    label="Extracted"
                    value={`${formatNumber(result.processingInsights.extractedCharacters)} chars`}
                  />
                  <InsightPill
                    label="Prompt"
                    value={`~${formatNumber(result.processingInsights.estimatedPromptTokens)} tokens`}
                  />
                  <InsightPill
                    label="Chunks"
                    value={`${result.processingInsights.artifactChunks} x ${formatNumber(result.processingInsights.chunkSizeCharacters)} chars`}
                  />
                  <InsightPill
                    label="AI elapsed"
                    value={`${(result.processingInsights.aiElapsedMs / 1000).toFixed(1)}s / ${(result.processingInsights.aiTimeoutMs / 1000).toFixed(0)}s`}
                  />
                  <InsightPill
                    label="Output budget"
                    value={`${formatNumber(result.processingInsights.outputTokenBudget)} tokens`}
                  />
                  <InsightPill
                    label="Vector DB"
                    value={result.processingInsights.vectorDbUsed ? "Used" : "Not used"}
                  />
                  <InsightPill
                    label="Excerpt limit"
                    value={`${formatNumber(result.processingInsights.excerptLimitPerArtifactCharacters)} chars/file`}
                  />
                  <InsightPill
                    label="AI status"
                    value={result.processingInsights.aiStatusDetail}
                  />
                </div>
              )}
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
                      {artifact.type} · {formatBytes(artifact.size)} ·{" "}
                      {formatNumber(artifact.characters)} chars extracted
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

function InsightPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-semibold text-slate-200">
        {value}
      </p>
    </div>
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
  artifact,
  onFileChange,
}: {
  name: string;
  label: string;
  artifact: SelectedArtifact | null;
  onFileChange: (artifact: SelectedArtifact | null) => void;
}) {
  return (
    <label
      className={`rounded-2xl border border-dashed p-4 ${
        artifact
          ? "border-emerald-400/30 bg-emerald-400/[0.06]"
          : "border-slate-700 bg-slate-950/70"
      }`}
    >
      <span className="mb-3 flex items-center justify-between gap-2 text-sm font-semibold text-slate-200">
        <span className="flex items-center gap-2">
          {artifact ? (
            <FileCheck2 size={16} className="text-emerald-300" />
          ) : (
            <Upload size={16} className="text-cyan-300" />
          )}
          {label}
        </span>
        {artifact && (
          <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-200">
            uploaded
          </span>
        )}
      </span>
      <input
        name={name}
        type="file"
        accept=".docx,.pdf,.txt,.md,.csv,.json,.xml"
        onChange={(event) => {
          const file = event.target.files?.[0];

          onFileChange(
            file
              ? {
                  name: file.name,
                  size: file.size,
                }
              : null,
          );
        }}
        className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-bold file:text-slate-950"
      />
      {artifact && (
        <p className="mt-3 truncate text-xs text-emerald-100">
          {artifact.name} · {formatBytes(artifact.size)}
        </p>
      )}
    </label>
  );
}

async function buildPeerReviewDocx(result: PeerReviewResult) {
  const children: DocxParagraph[] | DocxTable[] = [
    new DocxParagraph({
      heading: DocxHeadingLevel.TITLE,
      alignment: DocxAlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new DocxTextRun({
          text: "Atomix Peer Review Report",
          bold: true,
          color: "0891B2",
          size: 34,
          font: "Arial",
        }),
      ],
    }),
    new DocxParagraph({
      alignment: DocxAlignmentType.CENTER,
      spacing: { after: 280 },
      children: [
        new DocxTextRun({
          text: "Generated by Atomix Peer Review Agent",
          color: "64748B",
          size: 20,
          font: "Arial",
        }),
      ],
    }),
    metadataTable(result),
    new DocxParagraph({ text: "", spacing: { after: 180 } }),
    new DocxParagraph({
      heading: DocxHeadingLevel.HEADING_1,
      spacing: { before: 160, after: 120 },
      children: [
        new DocxTextRun({
          text: "Uploaded Evidence",
          bold: true,
          color: "0891B2",
          font: "Arial",
          size: 26,
        }),
      ],
    }),
    ...artifactParagraphs(result),
    new DocxParagraph({
      heading: DocxHeadingLevel.HEADING_1,
      spacing: { before: 260, after: 120 },
      children: [
        new DocxTextRun({
          text: "Peer Reviewer Comments",
          bold: true,
          color: "0891B2",
          font: "Arial",
          size: 26,
        }),
      ],
    }),
    ...markdownToDocxParagraphs(result.analysis),
  ];

  const doc = new DocxDocument({
    creator: "Atomix Peer Review Agent",
    title: "Atomix Peer Review Report",
    description: "Peer review comments and control coverage generated by Atomix.",
    styles: {
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
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });

  return DocxPacker.toBlob(doc);
}

function metadataTable(result: PeerReviewResult) {
  const risk = result.risk;
  const rows = [
    ["SPR", result.referencePackage || "Not provided", "SR", result.reviewRecord || "Not provided"],
    ["Scope", result.scope || "Not provided", "Review Type", result.typeOfReview || "Not provided"],
    ["Application Type", result.typeOfApplication || "Not provided", "Authentication", result.authentication || "Not provided"],
    ["Target URL", result.targetUrl || "Not provided", "IP Address", result.ipAddress || "Not provided"],
    ["Overall Risk", result.overallRisk || "Not provided", "CIA", risk ? `C:${risk.confidentiality} I:${risk.integrity} A:${risk.availability}` : "Not provided"],
    ["GRC Risk", result.grcRiskProfile || "Not provided", "Agent Risk", result.agentSuggestedRiskProfile || "Not provided"],
    ["Controls Reviewed", String(result.applicableControlCount), "Mode", result.mode],
    ["Generated", new Date().toLocaleString(), "Final Risk Confirmed", result.riskProfileConfirmed ? "Yes" : "No"],
  ];

  return new DocxTable({
    width: { size: 9360, type: DocxWidthType.DXA },
    columnWidths: [1685, 2995, 1685, 2995],
    layout: DocxTableLayoutType.FIXED,
    rows: rows.map((row) =>
      new DocxTableRow({
        children: row.map((value, index) =>
          new DocxTableCell({
            width: {
              size: index % 2 === 0 ? 1685 : 2995,
              type: DocxWidthType.DXA,
            },
            shading: {
              fill: index % 2 === 0 ? "E0F2FE" : "FFFFFF",
            },
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

function artifactParagraphs(result: PeerReviewResult) {
  if (result.artifacts.length === 0) {
    return [
      new DocxParagraph({
        children: [
          new DocxTextRun({
            text: "No artifacts were attached.",
            italics: true,
            color: "64748B",
            font: "Arial",
          }),
        ],
      }),
    ];
  }

  return result.artifacts.map(
    (artifact) =>
      new DocxParagraph({
        bullet: { level: 0 },
        spacing: { after: 80 },
        children: [
          new DocxTextRun({
            text: `${artifact.name}: `,
            bold: true,
            font: "Arial",
          }),
          new DocxTextRun({
            text: `${artifact.type}, ${formatBytes(artifact.size)}, ${formatNumber(artifact.characters)} characters extracted`,
            font: "Arial",
          }),
        ],
      }),
  );
}

function markdownToDocxParagraphs(markdown: string) {
  return markdown
    .split("\n")
    .flatMap((rawLine) => {
      const line = rawLine.trim();

      if (!line) {
        return [new DocxParagraph({ text: "", spacing: { after: 80 } })];
      }

      if (line.startsWith("# ")) {
        return [docxHeading(line.replace(/^#\s+/, ""), DocxHeadingLevel.HEADING_1)];
      }

      if (line.startsWith("## ")) {
        return [docxHeading(line.replace(/^##\s+/, ""), DocxHeadingLevel.HEADING_2)];
      }

      if (line.startsWith("### ")) {
        return [docxHeading(line.replace(/^###\s+/, ""), DocxHeadingLevel.HEADING_3)];
      }

      if (/^[-*]\s+/.test(line)) {
        return [
          new DocxParagraph({
            bullet: { level: 0 },
            spacing: { after: 80 },
            children: markdownRuns(line.replace(/^[-*]\s+/, "")),
          }),
        ];
      }

      if (/^\d+\.\s+/.test(line)) {
        return [
          new DocxParagraph({
            spacing: { after: 100 },
            children: markdownRuns(line),
          }),
        ];
      }

      return [
        new DocxParagraph({
          spacing: { after: 100 },
          children: markdownRuns(line),
        }),
      ];
    });
}

function docxHeading(text: string, level: (typeof DocxHeadingLevel)[keyof typeof DocxHeadingLevel]) {
  return new DocxParagraph({
    heading: level,
    spacing: { before: 220, after: 120 },
    children: [
      new DocxTextRun({
        text: stripMarkdown(text),
        bold: true,
        color: "0891B2",
        font: "Arial",
        size: level === DocxHeadingLevel.HEADING_1 ? 26 : 22,
      }),
    ],
  });
}

function markdownRuns(text: string) {
  const runs: DocxTextRun[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(
        new DocxTextRun({
          text: stripMarkdown(text.slice(lastIndex, match.index)),
          font: "Arial",
        }),
      );
    }

    const token = match[0];
    const isCode = token.startsWith("`");
    runs.push(
      new DocxTextRun({
        text: token.replace(/^(\*\*|`)|(\*\*|`)$/g, ""),
        bold: !isCode,
        font: isCode ? "Courier New" : "Arial",
        color: isCode ? "0E7490" : "0F172A",
      }),
    );
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    runs.push(
      new DocxTextRun({
        text: stripMarkdown(text.slice(lastIndex)),
        font: "Arial",
      }),
    );
  }

  return runs.length > 0 ? runs : [new DocxTextRun({ text: stripMarkdown(text), font: "Arial" })];
}

function stripMarkdown(value: string) {
  return value.replace(/\*\*/g, "").replace(/`/g, "");
}

function tableBorders() {
  return {
    top: { style: DocxBorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    bottom: { style: DocxBorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    left: { style: DocxBorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    right: { style: DocxBorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  };
}
