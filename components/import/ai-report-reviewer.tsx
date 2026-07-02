"use client";

import { Bot, FileSearch, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

type ProjectOption = {
  id: string;
  name: string;
  sprId: string | null;
};

type ReviewOption = {
  id: string;
  srId: string | null;
  title: string;
  status: string;
  projectId: string;
  iteration: string;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="min-w-0 space-y-2">
      <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function AIReportReviewer({
  projects,
  reviews,
}: {
  projects: ProjectOption[];
  reviews: ReviewOption[];
}) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [reviewId, setReviewId] = useState("");
  const [customFolder, setCustomFolder] = useState("");

  const projectReviews = reviews.filter(
    (review) => review.projectId === projectId
  );
  const selectedProject = projects.find((project) => project.id === projectId);
  const selectedReview = projectReviews.find((review) => review.id === reviewId);
  const iteration = selectedReview?.iteration ?? "Select SR first";
  const defaultFolder = [
    selectedProject?.sprId ?? selectedProject?.name ?? "Unassigned SPR",
    selectedReview?.srId ?? selectedReview?.title ?? "Unassigned SR",
    `Iteration ${selectedReview?.iteration ?? "1.0"}`,
  ].join(" / ");
  const folderName = customFolder.trim() || defaultFolder;

  async function submit(formData: FormData) {
    setLoading(true);
    setAnalysis("");
    const response = await fetch("/api/import/report-review", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setAnalysis(data.analysis ?? data.error ?? "No analysis returned.");
    setLoading(false);
  }

  return (
    <section className="min-w-0 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <Bot className="text-cyan-300" size={24} />
        <div>
          <h2 className="text-xl font-bold text-white">
            Upload review document
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Store FEAD, BEAD, LLM FEAD, scan reports, architecture diagrams,
            demo-call notes, and evidence against the selected SPR, SR, and
            review iteration. Optional AI review creates a concise intake
            summary from the uploaded artifact.
          </p>
        </div>
      </div>

      <form action={submit} className="space-y-4">
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <Field label="SPR / information system">
            <select
              name="projectId"
              value={projectId}
              onChange={(event) => {
                setProjectId(event.target.value);
                setReviewId("");
              }}
              className="w-full min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
              required
            >
              <option value="">Select project / SPR</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.sprId ?? "SPR pending"} · {project.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="SR / review">
            <select
              name="reviewId"
              value={reviewId}
              onChange={(event) => setReviewId(event.target.value)}
              className="w-full min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
              required
            >
              <option value="">Select SR / review</option>
              {projectReviews.map((review) => (
                <option key={review.id} value={review.id}>
                  {review.srId ?? review.title} · {review.status}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <input type="hidden" name="iteration" value={selectedReview?.iteration ?? "1.0"} />
        <input type="hidden" name="folderName" value={folderName} />
        <div className="grid min-w-0 gap-4 md:grid-cols-3">
          <div className="min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
            <span className="block text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Review iteration
            </span>
            <span className="font-semibold text-white">{iteration}</span>
          </div>
          <Field label="Document type">
            <select
              name="artifactType"
              className="w-full min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            >
              {[
                "FEAD",
                "BEAD",
                "LLM FEAD",
                "Scan Report",
                "Architecture Diagram",
                "Demo Call Notes",
                "Evidence Images",
                "Remediation Evidence",
                "Exception Evidence",
              ].map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </Field>
          <Field label="Source">
            <select
              name="scanner"
              className="w-full min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            >
              {[
                "Manual / Evidence",
                "Burp",
                "Mend",
                "AquaSec",
                "Checkmarx",
                "Qualys",
                "MSB",
                "LLM FEAD",
                "Generic",
              ].map((scanner) => (
                <option key={scanner}>{scanner}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid min-w-0 gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <Field label="Vault folder">
            <input
              value={customFolder}
              onChange={(event) => setCustomFolder(event.target.value)}
              placeholder={defaultFolder}
              className="w-full min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            />
          </Field>
          <Field label="Visibility">
            <select
              name="visibility"
              className="w-full min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white"
            >
              <option value="REVIEW_TEAM">Review team only</option>
              <option value="GOVERNANCE">Governance visible</option>
              <option value="LEADERSHIP">Leadership summary visible</option>
            </select>
          </Field>
          <Field label="File">
            <input
              name="file"
              type="file"
              accept=".pdf,.xml,.json,.csv,.txt,.html,.md,.doc,.docx,.png,.jpg,.jpeg"
              className="w-full min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black"
              required
            />
          </Field>
        </div>
        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 md:w-auto">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <FileSearch size={16} />}
          Add document to folder
        </button>
      </form>

      {analysis && (
        <pre className="mt-5 max-h-96 overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-5 whitespace-pre-wrap text-sm leading-6 text-slate-200">
          {analysis}
        </pre>
      )}
    </section>
  );
}
