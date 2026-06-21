"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
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
  content: string;
  createdAt: Date | string;
};

type Props = {
  docs: KnowledgeDoc[];
};

const typeOptions = [
  "All",
  "Guide",
  "FEAD",
  "BEAD",
  "LLM FEAD",
  "Scan Report",
  "Report",
  "Playbook",
  "Control",
];

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString();
}

function docIcon(type?: string | null) {
  if (type?.includes("Scan")) return ShieldCheck;
  if (type?.includes("LLM")) return Sparkles;
  if (type?.includes("Guide") || type?.includes("Playbook")) return BookOpen;

  return FileText;
}

export default function KnowledgeLibrary({ docs }: Props) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");

  const filteredDocs = useMemo(() => {
    const lowerQuery = query.toLowerCase().trim();

    return docs.filter((doc) => {
      const typeMatches =
        type === "All" ||
        doc.documentType === type ||
        doc.source === type;

      const queryMatches =
        !lowerQuery ||
        doc.title.toLowerCase().includes(lowerQuery) ||
        doc.source.toLowerCase().includes(lowerQuery) ||
        (doc.documentType ?? "").toLowerCase().includes(lowerQuery) ||
        doc.content.toLowerCase().includes(lowerQuery);

      return typeMatches && queryMatches;
    });
  }, [docs, query, type]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 px-6 py-4">
        <h2 className="text-xl font-bold text-white">
          Searchable Library
        </h2>
        <p className="text-sm text-slate-400">
          Evidence, playbooks, scan reports, FEAD/BEAD notes, and Copilot
          context.
        </p>
      </div>

      <div className="grid gap-3 border-b border-slate-800 p-6 lg:grid-cols-[1fr_220px]">
        <label className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search controls, findings, scan evidence, LLM notes..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-11 pr-4 text-white outline-none focus:border-cyan-400"
          />
        </label>

        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
        >
          {typeOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="divide-y divide-slate-800">
        {filteredDocs.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No matching knowledge documents.
          </div>
        )}

        {filteredDocs.slice(0, 14).map((doc) => {
          const Icon = docIcon(doc.documentType);

          return (
            <article key={doc.id} className="px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-300">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{doc.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {doc.source}
                      {doc.documentType ? ` · ${doc.documentType}` : ""} ·{" "}
                      {formatDate(doc.createdAt)}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full bg-slate-950 px-3 py-1 text-xs text-cyan-300">
                  {Math.round(doc.content.length / 1000)}k chars
                </span>
              </div>

              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
                {doc.content}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
