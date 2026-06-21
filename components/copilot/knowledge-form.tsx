"use client";

import { useState } from "react";

export default function KnowledgeForm() {
  const [title, setTitle] =
    useState("");

  const [documentType, setDocumentType] =
    useState("Guide");

  const [source, setSource] =
    useState("Manual");

  const [content, setContent] =
    useState("");

  async function save() {
    await fetch(
      "/api/knowledge",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          title,
          source,
          documentType,
          content,
        }),
      }
    );

    location.reload();
  }

  return (
    <div className="space-y-4">

      <input
        value={title}
        onChange={(e) =>
          setTitle(
            e.target.value
          )
        }
        placeholder="Document Title"
        className="
        w-full
        bg-slate-900
        border
        border-slate-800
        rounded-xl
        p-3
        "
      />

      <div className="grid gap-3 md:grid-cols-2">
        <select
          value={documentType}
          onChange={(e) =>
            setDocumentType(e.target.value)
          }
          className="
          w-full
          bg-slate-900
          border
          border-slate-800
          rounded-xl
          p-3
          "
        >
          <option>Guide</option>
          <option>Playbook</option>
          <option>Control</option>
          <option>FEAD</option>
          <option>BEAD</option>
          <option>LLM FEAD</option>
          <option>Scan Report</option>
          <option>Report</option>
        </select>

        <select
          value={source}
          onChange={(e) =>
            setSource(e.target.value)
          }
          className="
          w-full
          bg-slate-900
          border
          border-slate-800
          rounded-xl
          p-3
          "
        >
          <option>Manual</option>
          <option>Peer Review Guideline</option>
          <option>Scope Call Note</option>
          <option>Scan Evidence</option>
          <option>Imported Artifact</option>
        </select>
      </div>

      <textarea
        value={content}
        onChange={(e) =>
          setContent(
            e.target.value
          )
        }
        rows={10}
        placeholder="Paste pentest knowledge, control guidance, scope notes, or reviewer playbook..."
        className="
        w-full
        bg-slate-900
        border
        border-slate-800
        rounded-xl
        p-4
        "
      />

      <button
        onClick={save}
        disabled={!title || !content}
        className="
        px-6
        py-3
        bg-cyan-500
        text-black
        rounded-xl
        disabled:cursor-not-allowed
        disabled:opacity-50
        "
      >
        Save Document
      </button>

    </div>
  );
}
