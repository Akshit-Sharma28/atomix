"use client";

import { Download, FileText, Loader2, Printer } from "lucide-react";
import { useState } from "react";

export default function ExecutiveReportGenerator() {
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const response = await fetch("/api/reports/executive");
    const data = await response.json();
    setReport(data.report ?? "Unable to generate report.");
    setLoading(false);
  }

  function download() {
    const blob = new Blob([report], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "atomix-executive-report.md";
    link.click();
    URL.revokeObjectURL(url);
  }

  function printReport() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<pre style="font-family:Inter,Arial,sans-serif;white-space:pre-wrap;line-height:1.5">${report.replaceAll("<", "&lt;")}</pre>`);
    win.document.close();
    win.print();
  }

  return (
    <section className="mb-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <FileText className="text-cyan-300" size={22} />
            Generate Executive Report
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Creates a leadership-ready report from current projects, SRs,
            findings, extension requests, and agentic follow-up actions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={generate}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 font-bold text-slate-950"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
            Generate Report
          </button>
          <button
            onClick={download}
            disabled={!report}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 disabled:opacity-40"
          >
            <Download size={16} />
            Download
          </button>
          <button
            onClick={printReport}
            disabled={!report}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 disabled:opacity-40"
          >
            <Printer size={16} />
            Print / PDF
          </button>
        </div>
      </div>
      {report && (
        <pre className="mt-5 max-h-96 overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-5 whitespace-pre-wrap text-sm leading-6 text-slate-200">
          {report}
        </pre>
      )}
    </section>
  );
}
