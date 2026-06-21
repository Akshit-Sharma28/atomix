"use client";

import {
  Bot,
  CheckCircle2,
  FileSearch,
  Loader2,
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

export default function PeerReviewAgent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] =
    useState<PeerReviewResult | null>(null);

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
              Review Word artifacts and scan evidence
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Upload FEAD, BEAD, and applicable scanner reports. The agent
              cross-checks scope, risk, application context, and control
              coverage to identify missed testing, weak evidence, and findings
              that need reviewer follow-up.
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
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">
              Scope
            </span>
            <select
              name="scope"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
            >
              {scopes.map((scope) => (
                <option key={scope}>{scope}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">
              Type of Review
            </span>
            <select
              name="typeOfReview"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
            >
              <option>FULL</option>
              <option>Enhancement</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">
              Application Type
            </span>
            <select
              name="typeOfApplication"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
            >
              <option>Internal</option>
              <option>Intranet</option>
              <option>Internet</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">
              Network
            </span>
            <select
              name="network"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
            >
              <option>Adjacent</option>
              <option>Internal</option>
              <option>Internet exposed</option>
              <option>Segmented</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">
              Reference Package
            </span>
            <input
              name="referencePackage"
              placeholder="Project/package identifier"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-slate-400">
              Review Record
            </span>
            <input
              name="reviewRecord"
              placeholder="Review record identifier"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["confidentiality", "Confidentiality Risk"],
            ["integrity", "Integrity Risk"],
            ["availability", "Availability Risk"],
          ].map(([name, label]) => (
            <label key={name} className="block">
              <span className="mb-2 block text-sm text-slate-400">
                {label}
              </span>
              <select
                name={name}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
              >
                {riskLevels.map((risk) => (
                  <option key={risk}>{risk}</option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["feadFile", "FEAD Word/PDF"],
            ["beadFile", "BEAD Word/PDF"],
            ["aiQrmFile", "AI QRM / LLM Evidence"],
          ].map(([name, label]) => (
            <label
              key={name}
              className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 p-4"
            >
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
          ))}

          <label className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 p-4">
            <span className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Upload size={16} className="text-cyan-300" />
              Scanner Reports
            </span>
            <input
              name="scanFiles"
              type="file"
              multiple
              accept=".docx,.pdf,.txt,.md,.csv,.json,.xml"
              className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-bold file:text-slate-950"
            />
            <p className="mt-3 text-xs text-slate-500">
              Supports Qualys, Checkmarx, Mend, AquaSec, Burp, XML, CSV,
              markdown, text, and PDF exports.
            </p>
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm text-slate-400">
            Reviewer Notes
          </span>
          <textarea
            name="notes"
            rows={4}
            placeholder="Mention known constraints, controls marked N/A, or areas where you want a second look."
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
