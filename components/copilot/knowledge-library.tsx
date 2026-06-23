"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Database,
  FileText,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type KnowledgeDoc = {
  id: string;
  title: string;
  source: string;
  documentType: string | null;
  summary?: string;
  content: string;
  createdAt: Date | string;
  curated?: boolean;
};

type Props = {
  docs: KnowledgeDoc[];
};

const typeOptions = [
  "All",
  "Playbook",
  "Control",
  "Guide",
  "FEAD",
  "BEAD",
  "LLM FEAD",
  "Scan Report",
  "Report",
];

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString();
}

function docIcon(type?: string | null) {
  if (type?.includes("Scan")) return ShieldCheck;
  if (type?.includes("LLM")) return Sparkles;
  if (type?.includes("Guide") || type?.includes("Playbook")) return BookOpen;
  if (type?.includes("Control")) return Database;

  return FileText;
}

function snippet(doc: KnowledgeDoc) {
  return (doc.summary || doc.content)
    .replace(/^# .+$/m, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function KnowledgeLibrary({ docs }: Props) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [scope, setScope] = useState("All sources");
  const [selectedId, setSelectedId] = useState(docs[0]?.id ?? "");

  const filteredDocs = useMemo(() => {
    const lowerQuery = query.toLowerCase().trim();

    return docs.filter((doc) => {
      const typeMatches =
        type === "All" || doc.documentType === type || doc.source === type;

      const sourceMatches =
        scope === "All sources" ||
        (scope === "Curated" && doc.curated) ||
        (scope === "Uploaded / Manual" && !doc.curated);

      const queryMatches =
        !lowerQuery ||
        doc.title.toLowerCase().includes(lowerQuery) ||
        doc.source.toLowerCase().includes(lowerQuery) ||
        (doc.documentType ?? "").toLowerCase().includes(lowerQuery) ||
        doc.content.toLowerCase().includes(lowerQuery);

      return typeMatches && sourceMatches && queryMatches;
    });
  }, [docs, query, scope, type]);

  const selected =
    docs.find((doc) => doc.id === selectedId) ?? filteredDocs[0] ?? docs[0];

  return (
    <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80">
      <div className="border-b border-slate-800 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
              Library
            </div>
            <h2 className="text-2xl font-bold text-white">
              Searchable Knowledge Library
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Curated playbooks, uploaded artifacts, scan reports, and Copilot
              retrieval context in one place.
            </p>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-300">
            {filteredDocs.length} visible
          </span>
        </div>
      </div>

      <div className="grid gap-3 border-b border-slate-800 p-6 xl:grid-cols-[1fr_180px_200px]">
        <label className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search controls, demo call, retest, scan evidence, LLM notes..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-3 pl-11 pr-4 text-white outline-none focus:border-cyan-400"
          />
        </label>

        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
        >
          {typeOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>

        <select
          value={scope}
          onChange={(event) => setScope(event.target.value)}
          className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
        >
          {["All sources", "Curated", "Uploaded / Manual"].map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="grid min-h-[560px] xl:grid-cols-[0.9fr_1.1fr]">
        <div className="max-h-[650px] overflow-y-auto border-b border-slate-800 xl:border-b-0 xl:border-r">
          {filteredDocs.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No matching knowledge documents.
            </div>
          )}

          {filteredDocs.map((doc) => {
            const Icon = docIcon(doc.documentType);
            const active = selected?.id === doc.id;

            return (
              <button
                key={doc.id}
                onClick={() => setSelectedId(doc.id)}
                className={`w-full border-b border-slate-800 px-6 py-5 text-left transition ${
                  active ? "bg-cyan-950/20" : "hover:bg-slate-950/60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-300">
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white">{doc.title}</p>
                      {doc.curated && (
                        <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                          curated
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {doc.source}
                      {doc.documentType ? ` · ${doc.documentType}` : ""} ·{" "}
                      {formatDate(doc.createdAt)}
                    </p>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">
                      {snippet(doc)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selected ? (
          <article className="p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
                  {selected.documentType ?? "Document"}
                </p>
                <h3 className="mt-2 text-3xl font-bold text-white">
                  {selected.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {selected.source} · {formatDate(selected.createdAt)}
                </p>
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-cyan-300">
                {Math.round(selected.content.length / 1000)}k chars
              </span>
            </div>

            {selected.summary && (
              <div className="mb-5 rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-4 text-sm leading-6 text-cyan-100">
                {selected.summary}
              </div>
            )}

            <div className="max-h-[450px] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-sm leading-7 text-slate-300">
              {selected.content}
            </div>
          </article>
        ) : (
          <div className="grid place-items-center p-10 text-slate-500">
            Select a knowledge document.
          </div>
        )}
      </div>
    </section>
  );
}
