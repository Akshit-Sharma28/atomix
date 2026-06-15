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

  async function downloadPdf() {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    const generatedAt = new Date().toLocaleString();
    let y = margin;

    function addFooter(pageNumber: number) {
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, pageHeight - 42, pageWidth - margin, pageHeight - 42);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text("ATOMIX · Executive Security Report", margin, pageHeight - 25);
      pdf.text(
        `Page ${pageNumber}`,
        pageWidth - margin - 36,
        pageHeight - 25,
      );
    }

    function newPage() {
      addFooter(pdf.getNumberOfPages());
      pdf.addPage();
      y = margin;
    }

    function ensureSpace(space: number) {
      if (y + space > pageHeight - 60) {
        newPage();
      }
    }

    function sectionTitle(title: string) {
      ensureSpace(42);
      pdf.setFillColor(236, 254, 255);
      pdf.roundedRect(margin, y - 18, 8, 28, 3, 3, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.setTextColor(15, 23, 42);
      pdf.text(title, margin + 18, y);
      y += 24;
    }

    function bodyText(text: string, indent = 0) {
      const wrapped = pdf.splitTextToSize(
        text || " ",
        contentWidth - indent,
      );
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(51, 65, 85);

      for (const line of wrapped) {
        ensureSpace(15);
        pdf.text(line, margin + indent, y);
        y += 14;
      }
    }

    function bullet(text: string) {
      ensureSpace(18);
      pdf.setFillColor(6, 182, 212);
      pdf.circle(margin + 4, y - 3, 2.5, "F");
      bodyText(text.replace(/^[-•]\s*/, ""), 16);
    }

    function drawCard(
      x: number,
      cardY: number,
      width: number,
      title: string,
      value: string,
      accent: [number, number, number],
    ) {
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(x, cardY, width, 78, 12, 12, "FD");
      pdf.setFillColor(...accent);
      pdf.roundedRect(x, cardY, 6, 78, 3, 3, "F");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(title, x + 18, cardY + 24);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(...accent);
      pdf.text(value, x + 18, cardY + 56);
    }

    pdf.setFillColor(2, 6, 23);
    pdf.rect(0, 0, pageWidth, 150, "F");
    pdf.setFillColor(8, 145, 178);
    pdf.circle(pageWidth - 80, 54, 38, "F");
    pdf.setFillColor(103, 232, 249);
    pdf.circle(pageWidth - 80, 54, 24, "F");
    pdf.setTextColor(103, 232, 249);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("ATOMIX", margin, 36);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(28);
    pdf.text("Executive Security Report", margin, 72);
    pdf.setTextColor(203, 213, 225);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text("Security posture, SR delivery, findings, and governance actions", margin, 96);
    pdf.text(`Generated ${generatedAt}`, margin, 118);

    y = 185;
    const summaryMatches = {
      projects:
        report.match(/- (\d+) projects/)?.[1] ??
        "—",
      active:
        report.match(/- (\d+) active SRs/)?.[1] ??
        "—",
      critical:
        report.match(/- (\d+) critical/)?.[1] ??
        "—",
      unassigned:
        report.match(/- (\d+) SRs need reviewer/)?.[1] ??
        "—",
    };
    const cardWidth = (contentWidth - 36) / 4;
    drawCard(margin, y, cardWidth, "Projects / SPRs", summaryMatches.projects, [
      8,
      145,
      178,
    ]);
    drawCard(
      margin + cardWidth + 12,
      y,
      cardWidth,
      "Active SRs",
      summaryMatches.active,
      [37, 99, 235],
    );
    drawCard(
      margin + (cardWidth + 12) * 2,
      y,
      cardWidth,
      "Critical",
      summaryMatches.critical,
      [239, 68, 68],
    );
    drawCard(
      margin + (cardWidth + 12) * 3,
      y,
      cardWidth,
      "Unassigned SRs",
      summaryMatches.unassigned,
      [245, 158, 11],
    );

    y += 115;
    const lines = report.split("\n");
    let inList = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("# Atomix")) {
        y += 5;
        continue;
      }

      if (trimmed.startsWith("Generated:")) {
        continue;
      }

      if (trimmed.startsWith("##")) {
        inList = false;
        sectionTitle(trimmed.replace(/^##\s*/, ""));
        continue;
      }

      if (/^\d+\./.test(trimmed) || trimmed.startsWith("-")) {
        if (!inList) {
          y += 2;
          inList = true;
        }
        bullet(trimmed.replace(/^\d+\.\s*/, ""));
        continue;
      }

      inList = false;
      bodyText(trimmed);
      y += 4;
    }

    addFooter(pdf.getNumberOfPages());
    pdf.save("atomix-executive-report.pdf");
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
            onClick={downloadPdf}
            disabled={!report}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 disabled:opacity-40"
          >
            <Download size={16} />
            Download PDF
          </button>
          <button
            onClick={() => {
              const blob = new Blob([report], {
                type: "text/markdown;charset=utf-8",
              });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "atomix-executive-report.md";
              link.click();
              URL.revokeObjectURL(url);
            }}
            disabled={!report}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 disabled:opacity-40"
          >
            <FileText size={16} />
            Markdown
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
