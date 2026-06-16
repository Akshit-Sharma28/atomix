"use client";

import { Download, FileText, Loader2, Printer } from "lucide-react";
import { useState } from "react";

export default function ExecutiveReportGenerator() {
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);

  function parseReportValue(label: string, fallback = "—") {
    return report.match(new RegExp(`- ${label}: ([^\\n]+)`))?.[1] ?? fallback;
  }

  function compactMetric(value: string) {
    return value
      .replace(/\s+of\s+reviewer\s+capacity/i, "")
      .replace(/\s+against\s+expected\s+delivery\s+baseline/i, "")
      .replace(/\s+versus\s+.*$/i, "")
      .trim();
  }

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
      pdf.text("ATOMIX · Executive Delivery Report", margin, pageHeight - 25);
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
      const fontSize = value.length > 8 ? 16 : 22;
      pdf.setFontSize(fontSize);
      pdf.setTextColor(...accent);
      const wrappedValue = pdf.splitTextToSize(value, width - 32);
      pdf.text(wrappedValue.slice(0, 2), x + 18, cardY + 54);
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
    pdf.text("Executive Delivery Report", margin, 72);
    pdf.setTextColor(203, 213, 225);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(
      "Hours, chargeability, variance, trends, and delivery exceptions",
      margin,
      96,
    );
    pdf.text(`Generated ${generatedAt}`, margin, 118);

    y = 185;
    const summaryMatches = {
      hours: compactMetric(parseReportValue("Hours charged this week")),
      chargeability: compactMetric(parseReportValue("Chargeability")),
      variance: compactMetric(parseReportValue("Variance")),
      red: compactMetric(parseReportValue("Red engagements")),
    };
    const cardWidth = (contentWidth - 36) / 4;
    drawCard(margin, y, cardWidth, "Hours This Week", summaryMatches.hours, [
      8,
      145,
      178,
    ]);
    drawCard(
      margin + cardWidth + 12,
      y,
      cardWidth,
      "Chargeability",
      summaryMatches.chargeability,
      [37, 99, 235],
    );
    drawCard(
      margin + (cardWidth + 12) * 2,
      y,
      cardWidth,
      "Variance",
      summaryMatches.variance,
      [245, 158, 11],
    );
    drawCard(
      margin + (cardWidth + 12) * 3,
      y,
      cardWidth,
      "Red Engagements",
      summaryMatches.red,
      [239, 68, 68],
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
    const escapeHtml = (value: string) =>
      value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    const sections = report
      .split("\n## ")
      .map((section, index) => {
        const [heading, ...content] = section.replace(/^##\s*/, "").split("\n");
        if (index === 0) {
          return "";
        }

        return `
          <section class="section">
            <h2>${escapeHtml(heading)}</h2>
            <div class="body">${content
              .filter(Boolean)
              .map((line) =>
                line.startsWith("- ")
                  ? `<p class="bullet">${escapeHtml(line.slice(2))}</p>`
                  : `<p>${escapeHtml(line)}</p>`,
              )
              .join("")}</div>
          </section>
        `;
      })
      .join("");

    const generated = escapeHtml(
      report.match(/Generated: ([^\n]+)/)?.[1] ?? new Date().toLocaleString(),
    );
    const kpis = [
      ["Hours This Week", compactMetric(parseReportValue("Hours charged this week"))],
      ["Chargeability", compactMetric(parseReportValue("Chargeability"))],
      ["Variance", compactMetric(parseReportValue("Variance"))],
      ["Red Engagements", compactMetric(parseReportValue("Red engagements"))],
    ];

    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Atomix Executive Delivery Report</title>
          <style>
            @page { margin: 0.55in; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: #f8fafc;
              color: #0f172a;
              font-family: Inter, Arial, sans-serif;
              line-height: 1.45;
            }
            .cover {
              background: #020617;
              color: white;
              padding: 42px 48px;
              border-radius: 22px;
              position: relative;
              overflow: hidden;
            }
            .cover:after {
              content: "";
              position: absolute;
              right: 42px;
              top: 34px;
              width: 86px;
              height: 86px;
              border-radius: 999px;
              background: radial-gradient(circle, #7dd3fc 0 38%, #0891b2 39% 100%);
              opacity: .85;
            }
            .brand {
              color: #67e8f9;
              font-size: 13px;
              font-weight: 800;
              letter-spacing: .14em;
            }
            h1 {
              margin: 18px 0 10px;
              max-width: 620px;
              font-size: 42px;
              line-height: 1;
            }
            .subtitle {
              max-width: 650px;
              color: #cbd5e1;
              font-size: 15px;
            }
            .generated {
              margin-top: 18px;
              color: #94a3b8;
              font-size: 12px;
            }
            .kpis {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 14px;
              margin: 24px 0;
            }
            .kpi {
              border: 1px solid #e2e8f0;
              border-left: 7px solid #06b6d4;
              border-radius: 18px;
              background: white;
              padding: 18px;
              min-height: 92px;
            }
            .kpi:nth-child(2) { border-left-color: #2563eb; }
            .kpi:nth-child(3) { border-left-color: #f59e0b; }
            .kpi:nth-child(4) { border-left-color: #ef4444; }
            .kpi-label {
              color: #64748b;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: .08em;
              text-transform: uppercase;
            }
            .kpi-value {
              margin-top: 12px;
              color: #0f172a;
              font-size: 26px;
              font-weight: 900;
              overflow-wrap: anywhere;
            }
            .section {
              margin-top: 18px;
              border: 1px solid #e2e8f0;
              border-radius: 18px;
              background: white;
              padding: 20px 24px;
              break-inside: avoid;
            }
            h2 {
              margin: 0 0 12px;
              color: #0f172a;
              font-size: 18px;
            }
            p {
              margin: 7px 0;
              color: #334155;
              font-size: 12px;
            }
            .bullet {
              padding-left: 18px;
              position: relative;
            }
            .bullet:before {
              content: "";
              position: absolute;
              left: 0;
              top: 7px;
              width: 6px;
              height: 6px;
              border-radius: 999px;
              background: #06b6d4;
            }
            @media print {
              body { background: white; }
              .cover, .section, .kpi { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <main>
            <header class="cover">
              <div class="brand">ATOMIX</div>
              <h1>Executive Delivery Report</h1>
              <div class="subtitle">Hours, chargeability, KPI variance, trends, red engagements, unassigned reviews, reschedules, cancellations, and extension queues.</div>
              <div class="generated">Generated ${generated}</div>
            </header>
            <div class="kpis">
              ${kpis
                .map(
                  ([label, value]) => `
                    <div class="kpi">
                      <div class="kpi-label">${escapeHtml(label)}</div>
                      <div class="kpi-value">${escapeHtml(value)}</div>
                    </div>
                  `,
                )
                .join("")}
            </div>
            ${sections}
          </main>
        </body>
      </html>
    `);
    win.document.close();
    win.onload = () => win.print();
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
            Creates a leadership-ready delivery report covering hours,
            chargeability, KPI variance, trends, red engagements, unassigned
            reviews, reschedules, cancellations, and extension queues.
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
