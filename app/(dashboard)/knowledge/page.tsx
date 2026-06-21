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

export default async function KnowledgePage() {
  const docs =
    await prisma.knowledgeDocument.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

  const manualDocs =
    docs.filter(
      (doc) => doc.source === "Manual"
    ).length;

  const uploadedReports =
    docs.filter(
      (doc) =>
        doc.source === "PDF Upload" ||
        doc.source === "Scan Evidence" ||
        doc.documentType === "Report" ||
        doc.documentType === "Scan Report"
    ).length;

  const reviewArtifacts =
    docs.filter((doc) =>
      [
        "FEAD",
        "BEAD",
        "LLM FEAD",
      ].includes(doc.documentType ?? "")
    ).length;

  const totalCharacters =
    docs.reduce(
      (sum, doc) =>
        sum + doc.content.length,
      0
    );

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <Brain
            size={40}
            className="text-cyan-400"
          />

          <div>
            <div className="mb-2 text-sm text-slate-500">
              Knowledge
            </div>

              <h1 className="text-4xl font-bold text-white">
              Knowledge Base
            </h1>

            <p className="mt-2 max-w-3xl text-slate-400">
              Review artifacts, scan reports, playbooks, LLM FEAD guidance,
              scope notes, and reusable controls for Security Copilot context.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5">
          <Library className="mb-4 text-cyan-300" />
          <p className="text-sm text-slate-400">Documents</p>
          <p className="mt-2 text-3xl font-bold text-cyan-300">
            {docs.length}
          </p>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-slate-900 p-5">
          <FileText className="mb-4 text-purple-300" />
          <p className="text-sm text-slate-400">Manual Notes</p>
          <p className="mt-2 text-3xl font-bold text-purple-300">
            {manualDocs}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-slate-900 p-5">
          <Upload className="mb-4 text-emerald-300" />
          <p className="text-sm text-slate-400">Scan Reports</p>
          <p className="mt-2 text-3xl font-bold text-emerald-300">
            {uploadedReports}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <Brain className="mb-4 text-slate-300" />
          <p className="text-sm text-slate-400">Review Artifacts</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {reviewArtifacts}
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-cyan-500/20 bg-slate-900 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Copilot Retrieval Context
            </h2>
            <p className="mt-2 max-w-4xl text-slate-400">
              This library is the source material used by the agent workflows:
              scope-call notes define review boundaries, FEAD/BEAD/LLM FEAD
              artifacts define expected controls, scan reports provide evidence,
              and playbooks guide peer-review checks.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 px-5 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Context Size
            </p>
            <p className="mt-1 text-2xl font-bold text-cyan-300">
              {Math.round(totalCharacters / 1000)}k chars
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 text-xl font-bold text-white">
              Add Knowledge
            </h2>
            <KnowledgeForm />
          </div>

          <ReportUpload />
        </section>

        <KnowledgeLibrary docs={docs} />
      </div>
    </div>
  );
}
