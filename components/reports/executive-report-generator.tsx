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

  function numberFromReport(label: string) {
    const value = compactMetric(parseReportValue(label, "0"));
    const parsed = Number.parseInt(value.replace(/[^\d-]/g, ""), 10);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  function trendFromReport(label: string) {
    const value = parseReportValue(label, "0");
    const parsed = Number.parseInt(value.replace(/[^\d-]/g, ""), 10);

    return Number.isFinite(parsed) ? parsed : 0;
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

    function drawBar(
      x: number,
      barY: number,
      width: number,
      label: string,
      value: number,
      max: number,
      accent: [number, number, number],
    ) {
      const fillWidth = Math.max(6, (Math.abs(value) / Math.max(max, 1)) * width);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      pdf.text(label, x, barY);
      pdf.setFillColor(226, 232, 240);
      pdf.roundedRect(x, barY + 8, width, 9, 4, 4, "F");
      pdf.setFillColor(...accent);
      pdf.roundedRect(x, barY + 8, fillWidth, 9, 4, 4, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...accent);
      pdf.text(String(value), x + width + 10, barY + 16);
    }

    function drawVisualPanel() {
      const activeSrs = numberFromReport("Active SRs");
      const unassigned = numberFromReport("Unassigned reviews");
      const extensions = numberFromReport("Extensions needed");
      const reschedules = numberFromReport("Rescheduled reviews");
      const red = numberFromReport("Red engagements");
      const chargeability = numberFromReport("Chargeability");
      const weekTrendValue = trendFromReport("Weekly hours trend");
      const monthTrendValue = trendFromReport("Monthly hours trend");
      const panelHeight = 150;

      ensureSpace(panelHeight + 24);
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(margin, y, contentWidth, panelHeight, 14, 14, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.setTextColor(15, 23, 42);
      pdf.text("Portfolio Visual Signals", margin + 18, y + 26);

      const barX = margin + 18;
      const barWidth = 145;
      const maxQueue = Math.max(activeSrs, unassigned, extensions, reschedules, red, 1);
      drawBar(barX, y + 50, barWidth, "Active SRs", activeSrs, maxQueue, [8, 145, 178]);
      drawBar(barX, y + 78, barWidth, "Unassigned", unassigned, maxQueue, [245, 158, 11]);
      drawBar(barX, y + 106, barWidth, "Extensions", extensions, maxQueue, [239, 68, 68]);

      const gaugeX = margin + contentWidth - 172;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text("Chargeability", gaugeX, y + 54);
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(12);
      pdf.circle(gaugeX + 55, y + 88, 38, "S");
      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(12);
      pdf.circle(gaugeX + 55, y + 88, Math.max(8, Math.min(38, chargeability * 0.38)), "S");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.setTextColor(37, 99, 235);
      pdf.text(`${chargeability}%`, gaugeX + 32, y + 95);

      const trendX = margin + 245;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text("Trend Movement", trendX, y + 54);
      pdf.setDrawColor(203, 213, 225);
      pdf.line(trendX, y + 116, trendX + 145, y + 116);
      pdf.setDrawColor(8, 145, 178);
      pdf.setLineWidth(3);
      pdf.line(trendX, y + 96, trendX + 70, y + 86 - weekTrendValue * 0.2);
      pdf.line(trendX + 70, y + 86 - weekTrendValue * 0.2, trendX + 145, y + 92 - monthTrendValue * 0.08);
      pdf.setFillColor(8, 145, 178);
      pdf.circle(trendX, y + 96, 4, "F");
      pdf.circle(trendX + 70, y + 86 - weekTrendValue * 0.2, 4, "F");
      pdf.circle(trendX + 145, y + 92 - monthTrendValue * 0.08, 4, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`Week ${weekTrendValue >= 0 ? "+" : ""}${weekTrendValue}h`, trendX, y + 134);
      pdf.text(`Month ${monthTrendValue >= 0 ? "+" : ""}${monthTrendValue}h`, trendX + 82, y + 134);

      y += panelHeight + 28;
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
      "Hours, chargeability, variance, productivity framing, and delivery exceptions",
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
    drawVisualPanel();
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
    const visualMetrics = {
      activeSrs: numberFromReport("Active SRs"),
      unassigned: numberFromReport("Unassigned reviews"),
      extensions: numberFromReport("Extensions needed"),
      reschedules: numberFromReport("Rescheduled reviews"),
      red: numberFromReport("Red engagements"),
      chargeability: numberFromReport("Chargeability"),
      variance: numberFromReport("Variance"),
      weekTrend: trendFromReport("Weekly hours trend"),
      monthTrend: trendFromReport("Monthly hours trend"),
    };
    const maxQueue = Math.max(
      visualMetrics.activeSrs,
      visualMetrics.unassigned,
      visualMetrics.extensions,
      visualMetrics.reschedules,
      visualMetrics.red,
      1,
    );
    const barWidth = (value: number) =>
      `${Math.max(5, Math.min(100, Math.round((Math.abs(value) / maxQueue) * 100)))}%`;

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
            .visual-grid {
              display: grid;
              grid-template-columns: 1.15fr .85fr;
              gap: 18px;
              margin: 8px 0 24px;
            }
            .visual-card {
              border: 1px solid #e2e8f0;
              border-radius: 22px;
              background: white;
              padding: 22px 24px;
              break-inside: avoid;
            }
            .visual-title {
              margin: 0 0 16px;
              color: #0f172a;
              font-size: 17px;
              font-weight: 900;
            }
            .bar-row {
              display: grid;
              grid-template-columns: 130px 1fr 44px;
              align-items: center;
              gap: 12px;
              margin: 14px 0;
              font-size: 12px;
              color: #475569;
            }
            .bar-track {
              height: 12px;
              border-radius: 999px;
              background: #e2e8f0;
              overflow: hidden;
            }
            .bar-fill {
              height: 100%;
              border-radius: 999px;
              background: linear-gradient(90deg, #06b6d4, #67e8f9);
            }
            .bar-fill.warn { background: linear-gradient(90deg, #f59e0b, #fde68a); }
            .bar-fill.risk { background: linear-gradient(90deg, #ef4444, #fca5a5); }
            .donut-wrap {
              display: grid;
              grid-template-columns: 132px 1fr;
              align-items: center;
              gap: 18px;
            }
            .donut {
              width: 128px;
              height: 128px;
              border-radius: 999px;
              display: grid;
              place-items: center;
              background: conic-gradient(#2563eb 0 ${visualMetrics.chargeability}%, #e2e8f0 ${visualMetrics.chargeability}% 100%);
            }
            .donut-center {
              display: grid;
              width: 82px;
              height: 82px;
              place-items: center;
              border-radius: 999px;
              background: white;
              color: #0f172a;
              font-size: 24px;
              font-weight: 900;
            }
            .trend-strip {
              display: grid;
              gap: 10px;
              margin-top: 18px;
            }
            .trend-pill {
              display: flex;
              justify-content: space-between;
              border-radius: 14px;
              background: #f1f5f9;
              padding: 10px 12px;
              color: #334155;
              font-size: 12px;
              font-weight: 700;
            }
            .trend-pill span:last-child {
              color: #0891b2;
              font-weight: 900;
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
              .cover, .section, .kpi, .visual-card { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <main>
            <header class="cover">
              <div class="brand">ATOMIX</div>
              <h1>Executive Delivery Report</h1>
              <div class="subtitle">Hours, chargeability, KPI variance, productivity framing, red engagements, unassigned reviews, reschedules, cancellations, and extension queues.</div>
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
            <section class="visual-grid">
              <div class="visual-card">
                <h2 class="visual-title">Queue Composition</h2>
                ${[
                  ["Active SRs", visualMetrics.activeSrs, ""],
                  ["Unassigned", visualMetrics.unassigned, "warn"],
                  ["Extensions", visualMetrics.extensions, "risk"],
                  ["Rescheduled", visualMetrics.reschedules, "warn"],
                  ["Red Engagements", visualMetrics.red, "risk"],
                ]
                  .map(
                    ([label, value, tone]) => `
                      <div class="bar-row">
                        <div>${escapeHtml(String(label))}</div>
                        <div class="bar-track">
                          <div class="bar-fill ${escapeHtml(String(tone))}" style="width:${barWidth(Number(value))}"></div>
                        </div>
                        <strong>${Number(value)}</strong>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
              <div class="visual-card">
                <h2 class="visual-title">Delivery Health</h2>
                <div class="donut-wrap">
                  <div class="donut"><div class="donut-center">${visualMetrics.chargeability}%</div></div>
                  <div>
                    <p><strong>Chargeability</strong> shows reviewer load against available capacity.</p>
                    <p><strong>Variance:</strong> ${visualMetrics.variance >= 0 ? "+" : ""}${visualMetrics.variance}h against expected baseline.</p>
                  </div>
                </div>
                <div class="trend-strip">
                  <div class="trend-pill"><span>Weekly trend</span><span>${visualMetrics.weekTrend >= 0 ? "+" : ""}${visualMetrics.weekTrend}h</span></div>
                  <div class="trend-pill"><span>Monthly trend</span><span>${visualMetrics.monthTrend >= 0 ? "+" : ""}${visualMetrics.monthTrend}h</span></div>
                </div>
              </div>
            </section>
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
            chargeability, KPI variance, measured-vs-potential productivity
            framing, red engagements, unassigned reviews, reschedules,
            cancellations, and extension queues.
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
