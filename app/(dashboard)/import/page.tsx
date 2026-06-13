import ImportUploader from "@/components/import/import-uploader";
import { prisma } from "@/lib/prisma";
import {
  FileCode2,
  FileSpreadsheet,
  ShieldCheck,
  Upload,
} from "lucide-react";

export default async function ImportPage() {
  const [projects, recentImports] =
    await Promise.all([
      prisma.project.findMany({
        select: {
          id: true,
          name: true,
          sprId: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.finding.findMany({
        where: {
          source: {
            contains: "Burp",
          },
        },
        include: {
          project: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
      }),
    ]);

  return (
    <div className="w-full px-8 py-6">
      <div className="mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <Upload
            size={40}
            className="text-cyan-400"
          />

          <div>
            <div className="mb-2 text-sm text-slate-500">
              Import
            </div>

            <h1 className="text-4xl font-bold text-white">
              Scanner Import Center
            </h1>

            <p className="mt-2 max-w-3xl text-slate-400">
              Bring scanner output into Atomix with project context so findings
              land under the right SPR/SR workflow.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5">
          <FileCode2 className="mb-4 text-cyan-300" />
          <h2 className="font-semibold text-white">
            Burp Suite XML
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Supported now. Findings are mapped to selected projects.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <FileSpreadsheet className="mb-4 text-slate-400" />
          <h2 className="font-semibold text-white">
            CSV / XLSX
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Planned for scanner-neutral imports and manual pentest results.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <ShieldCheck className="mb-4 text-slate-400" />
          <h2 className="font-semibold text-white">
            Auto Deduplication
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Planned for recurring pentests and finding version history.
          </p>
        </div>
      </div>

      <ImportUploader projects={projects} />

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-6 py-4">
          <h2 className="text-xl font-bold text-white">
            Recent Burp Imports
          </h2>
          <p className="text-sm text-slate-400">
            Latest imported findings from scanner sources.
          </p>
        </div>

        <div className="divide-y divide-slate-800">
          {recentImports.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No Burp findings imported yet.
            </div>
          )}

          {recentImports.map((finding) => (
            <div
              key={finding.id}
              className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
            >
              <div>
                <p className="font-medium text-white">
                  {finding.title}
                </p>
                <p className="text-sm text-slate-500">
                  {finding.project.sprId ??
                    finding.project.name}
                  {" · "}
                  {finding.severity}
                </p>
              </div>

              <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                {finding.source}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
