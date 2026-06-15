"use client";

import { useState } from "react";

export default function CopilotChat({
  initialPrompt = "",
}: {
  initialPrompt?: string;
}) {
  const [question, setQuestion] =
    useState(initialPrompt);

  const [response, setResponse] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function ask() {
    if (!question) return;

    setLoading(true);

    try {
      const res = await fetch(
        "/api/copilot",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            question,
          }),
        }
      );

      const data =
        await res.json();

      setResponse(
        data.answer ??
          "No response"
      );
    } catch {
      setResponse(
        "Unable to contact Copilot"
      );
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap gap-2">

        {[
          "Summarize agentic governance risks",
          "Draft executive risk brief",
          "Recommend reviewer assignments",
          "Show critical findings",
          "Show overdue findings",
          "Which project has highest risk?",
          "List all SQL Injection findings",
          "Who owns critical findings?",
        ].map((prompt) => (
          <button
            key={prompt}
            onClick={() =>
              setQuestion(prompt)
            }
            className="
            px-3
            py-2
            rounded-lg
            bg-slate-800
            hover:bg-slate-700
            text-sm
            "
          >
            {prompt}
          </button>
        ))}

      </div>

      <textarea
        value={question}
        onChange={(e) =>
          setQuestion(
            e.target.value
          )
        }
        rows={5}
        placeholder="Ask Atomix..."
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
        onClick={ask}
        disabled={loading}
        className="
        px-6
        py-3
        rounded-xl
        bg-cyan-500
        text-black
        font-semibold
        "
      >
        {loading
          ? "Thinking..."
          : "Ask Copilot"}
      </button>

      {response && (
        <div
          className="
          bg-slate-900
          border
          border-slate-800
          rounded-xl
          p-5
          whitespace-pre-wrap
          "
        >
          {response}
        </div>
      )}

    </div>
  );
}
