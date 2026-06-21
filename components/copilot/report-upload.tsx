"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReportUpload() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [documentType, setDocumentType] =
    useState("Scan Report");

  const [source, setSource] =
    useState("Scan Evidence");

  async function upload(
    file: File
  ) {
    setLoading(true);

    const form =
      new FormData();

    form.append(
      "file",
      file
    );
    form.append(
      "documentType",
      documentType
    );
    form.append(
      "source",
      source
    );

    await fetch(
      "/api/knowledge/upload",
      {
        method: "POST",
        body: form,
      }
    );

    setLoading(false);

    router.refresh();
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

      <h2 className="text-xl font-bold mb-4">
        Import Evidence
      </h2>

      <p className="mb-4 text-sm text-slate-400">
        Upload FEAD, BEAD, LLM FEAD, scan reports, PDFs, Word docs, markdown,
        XML, JSON, CSV, or text files for Copilot context.
      </p>

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <select
          value={documentType}
          onChange={(event) =>
            setDocumentType(event.target.value)
          }
          className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white"
        >
          <option>Scan Report</option>
          <option>FEAD</option>
          <option>BEAD</option>
          <option>LLM FEAD</option>
          <option>Report</option>
          <option>Playbook</option>
          <option>Control</option>
        </select>

        <select
          value={source}
          onChange={(event) =>
            setSource(event.target.value)
          }
          className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white"
        >
          <option>Scan Evidence</option>
          <option>PDF Upload</option>
          <option>Imported Artifact</option>
          <option>Peer Review Guideline</option>
          <option>Scope Call Note</option>
        </select>
      </div>

      <input
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md,.xml,.json,.csv"
        onChange={(e) => {
          const file =
            e.target.files?.[0];

          if (file) {
            upload(file);
          }
        }}
      />

      {loading && (
        <p className="mt-3 text-sm text-cyan-300">
          Processing artifact...
        </p>
      )}

    </div>
  );
}
