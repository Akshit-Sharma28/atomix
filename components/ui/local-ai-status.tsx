"use client";

import { useEffect, useMemo, useState } from "react";
import { Cpu, Loader2, WifiOff } from "lucide-react";

type AiStatus = {
  status: "online" | "offline" | "checking";
  models: {
    name?: string;
    model?: string;
  }[];
};

export default function LocalAiStatus({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [aiStatus, setAiStatus] = useState<AiStatus>({
    status: "checking",
    models: [],
  });

  useEffect(() => {
    let mounted = true;

    async function checkStatus() {
      try {
        const response = await fetch("/api/ollama/status", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!mounted) return;

        setAiStatus({
          status: data.status === "online" ? "online" : "offline",
          models: Array.isArray(data.models) ? data.models : [],
        });
      } catch {
        if (!mounted) return;
        setAiStatus({
          status: "offline",
          models: [],
        });
      }
    }

    checkStatus();
    const interval = window.setInterval(checkStatus, 30000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const label = useMemo(() => {
    if (aiStatus.status === "checking") return "Checking Local AI";
    if (aiStatus.status === "online") return "Local AI Online";
    return "Local AI Offline";
  }, [aiStatus.status]);

  const helper =
    aiStatus.status === "online"
      ? `${aiStatus.models.length || 1} local model${aiStatus.models.length === 1 ? "" : "s"} available`
      : aiStatus.status === "checking"
        ? "Testing Ollama connectivity"
        : "Copilot can still use fallback routes if configured";

  const Icon =
    aiStatus.status === "checking"
      ? Loader2
      : aiStatus.status === "online"
        ? Cpu
        : WifiOff;

  return (
    <div
      className={`inline-flex items-center gap-3 rounded-2xl border px-4 py-3 ${
        aiStatus.status === "online"
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          : aiStatus.status === "checking"
            ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
            : "border-amber-400/30 bg-amber-400/10 text-amber-200"
      } ${compact ? "px-3 py-2 text-xs" : "text-sm"}`}
    >
      <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-950/70">
        <Icon
          size={compact ? 15 : 17}
          className={aiStatus.status === "checking" ? "animate-spin" : ""}
        />
        {aiStatus.status === "online" && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
        )}
      </span>
      <span>
        <span className="block font-bold">{label}</span>
        {!compact && <span className="block text-xs opacity-75">{helper}</span>}
      </span>
    </div>
  );
}
