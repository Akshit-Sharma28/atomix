"use client";

import { useState } from "react";

export default function KnowledgeForm() {
  const [title, setTitle] =
    useState("");

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
          source: "Manual",
          documentType:
            "Guide",
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

      <textarea
        value={content}
        onChange={(e) =>
          setContent(
            e.target.value
          )
        }
        rows={10}
        placeholder="Paste pentest knowledge..."
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
        className="
        px-6
        py-3
        bg-cyan-500
        text-black
        rounded-xl
        "
      >
        Save Document
      </button>

    </div>
  );
}