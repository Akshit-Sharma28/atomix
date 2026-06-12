"use client";

import { Brain, Loader2 } from "lucide-react";
import { useState } from "react";

export default function AnalyzeButton({
  findingId,
}: {
  findingId: string;
}) {
  const [loading, setLoading] =
    useState(false);

  async function analyze() {
    try {
      setLoading(true);

      await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          findingId,
        }),
      });

      window.location.reload();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={analyze}
      disabled={loading}
      className="
      inline-flex
      items-center
      gap-2
      bg-cyan-500
      hover:bg-cyan-400
      disabled:bg-slate-700
      disabled:cursor-not-allowed
      text-slate-950
      font-semibold
      px-6
      py-3
      rounded-xl
      transition-all
      shadow-lg
      shadow-cyan-500/20
      hover:shadow-cyan-500/40
      hover:scale-[1.02]
      "
    >
      {loading ? (
        <>
          <Loader2
            size={18}
            className="animate-spin"
          />
          Analyzing...
        </>
      ) : (
        <>
          <Brain size={18} />
          Generate AI Analysis
        </>
      )}
    </button>
  );
}