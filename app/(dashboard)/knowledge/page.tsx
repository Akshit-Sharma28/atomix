import {
  Brain,
  FileText,
  Library,
  Upload,
} from "lucide-react";
import KnowledgeForm from "@/components/copilot/knowledge-form";
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
        doc.documentType === "Report"
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
              Pentest playbooks, scanner notes, LLM guidance, MCP testing
              notes, and uploaded reports for Security Copilot context.
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
          <p className="text-sm text-slate-400">Reports</p>
          <p className="mt-2 text-3xl font-bold text-emerald-300">
            {uploadedReports}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <Brain className="mb-4 text-slate-300" />
          <p className="text-sm text-slate-400">Context Size</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {Math.round(totalCharacters / 1000)}k
          </p>
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

        <section className="rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="text-xl font-bold text-white">
              Library
            </h2>
            <p className="text-sm text-slate-400">
              Recent documents available to Copilot.
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {docs.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No knowledge documents yet.
              </div>
            )}

            {docs.slice(0, 10).map((doc) => (
              <div
                key={doc.id}
                className="px-6 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">
                      {doc.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {doc.source}
                      {doc.documentType
                        ? ` · ${doc.documentType}`
                        : ""}
                    </p>
                  </div>

                  <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                    {doc.content.length} chars
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-slate-400">
                  {doc.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
