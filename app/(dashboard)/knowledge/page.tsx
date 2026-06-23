import {
  Brain,
  FileText,
  Library,
  Upload,
} from "lucide-react";

import KnowledgeForm from "@/components/copilot/knowledge-form";
import KnowledgeLibrary from "@/components/copilot/knowledge-library";
import ReportUpload from "@/components/copilot/report-upload";
import { prisma } from "@/lib/prisma";
import { getLibraryKnowledgeDocuments } from "@/services/knowledge/library-files.service";

export default async function KnowledgePage() {
  const [databaseDocs, curatedDocs] = await Promise.all([
    prisma.knowledgeDocument.findMany({
      orderBy: {
        createdAt: "desc",
      },
    }),
    getLibraryKnowledgeDocuments(),
  ]);

  const docs = [
    ...curatedDocs,
    ...databaseDocs.map((doc) => ({
      ...doc,
      summary: "",
      curated: false,
    })),
  ];

  const manualDocs = docs.filter((doc) => doc.source === "Manual").length;
  const uploadedReports = docs.filter(
    (doc) =>
      doc.source === "PDF Upload" ||
      doc.source === "Scan Evidence" ||
      doc.documentType === "Report" ||
      doc.documentType === "Scan Report"
  ).length;
  const curatedCount = docs.filter((doc) => doc.curated).length;
  const totalCharacters = docs.reduce((sum, doc) => sum + doc.content.length, 0);

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-8 border-b border-slate-800 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <Brain size={32} />
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
                Knowledge Library
              </div>
              <h1 className="text-5xl font-black text-white">
                Copilot Knowledge Base
              </h1>
              <p className="mt-2 max-w-4xl text-slate-400">
                Curated governance playbooks, FEAD/BEAD/LLM guidance, scan
                evidence, scope notes, and uploaded artifacts used by Atomix
                agents and Security Copilot.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Context Size
            </p>
            <p className="mt-1 text-3xl font-black text-cyan-300">
              {Math.round(totalCharacters / 1000)}k
              <span className="ml-1 text-sm text-slate-500">chars</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        {[
          {
            label: "Total Documents",
            value: docs.length,
            icon: Library,
            color: "text-cyan-300",
            border: "border-cyan-500/20",
          },
          {
            label: "Curated Files",
            value: curatedCount,
            icon: Brain,
            color: "text-emerald-300",
            border: "border-emerald-500/20",
          },
          {
            label: "Manual Notes",
            value: manualDocs,
            icon: FileText,
            color: "text-purple-300",
            border: "border-purple-500/20",
          },
          {
            label: "Scan Reports",
            value: uploadedReports,
            icon: Upload,
            color: "text-amber-300",
            border: "border-amber-500/20",
          },
        ].map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className={`rounded-2xl border ${card.border} bg-slate-900/80 p-5`}
            >
              <Icon className={`mb-4 ${card.color}`} />
              <p className="text-sm text-slate-400">{card.label}</p>
              <p className={`mt-2 text-3xl font-bold ${card.color}`}>
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mb-8 rounded-[2rem] border border-cyan-500/20 bg-slate-900/80 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [
              "Curated governance memory",
              "Default markdown files now seed validator, peer review, retest, scan evidence, and LLM review guidance.",
            ],
            [
              "Retrieval-ready structure",
              "Documents are grouped by playbook, control, scan report, LLM FEAD, and uploaded/manual source.",
            ],
            [
              "Reviewer-safe usage",
              "Copilot can summarize and draft, while record changes stay governed through workflow actions.",
            ],
          ].map(([title, text]) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
            >
              <p className="font-bold text-white">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        <KnowledgeLibrary docs={docs} />

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="mb-2 text-2xl font-bold text-white">
              Add Manual Knowledge
            </h2>
            <p className="mb-5 text-sm text-slate-400">
              Add reviewer notes, scope snippets, control guidance, or operating
              playbooks directly into Copilot context.
            </p>
            <KnowledgeForm />
          </section>

          <ReportUpload />
        </div>
      </div>
    </div>
  );
}
