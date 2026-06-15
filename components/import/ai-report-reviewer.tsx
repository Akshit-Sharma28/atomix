"use client";

import { Bot, FileSearch, Loader2 } from "lucide-react";
import { useState } from "react";

type ProjectOption = {
  id: string;
  name: string;
  sprId: string | null;
};

export default function AIReportReviewer({
  projects,
}: {
  projects: ProjectOption[];
}) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

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
    <section className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-6">
      <div className="mb-5 flex items-start gap-3">
        <Bot className="text-cyan-300" size={24} />
        <div>
          <h2 className="text-xl font-bold text-white">
            AI Report & Document Reviewer
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            RAG-style scanner document review for Burp, Mend, AquaSec,
            Checkmarx, Qualys, MSB, CSV/XML, and PDF reports. The report is
            stored as knowledge and analyzed with project context.
          </p>
        </div>
      </div>

      <form action={submit} className="grid gap-3 lg:grid-cols-4">
        <select
          name="projectId"
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
          required
        >
          <option value="">Select project / SPR</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.sprId ?? "SPR pending"} · {project.name}
            </option>
          ))}
        </select>
        <select
          name="scanner"
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
        >
          {["Burp", "Mend", "AquaSec", "Checkmarx", "Qualys", "MSB", "Generic"].map(
            (scanner) => (
              <option key={scanner}>{scanner}</option>
            ),
          )}
        </select>
        <input
          name="file"
          type="file"
          accept=".pdf,.xml,.json,.csv,.txt,.html,.md"
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white"
          required
        />
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <FileSearch size={16} />}
          Analyze Report
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
