"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Plus,
  X,
} from "lucide-react";

export default function NewProjectForm() {
  const router = useRouter();

  const [open, setOpen] =
    useState(false);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");

  async function createProject(
    formData: FormData
  ) {
    setError("");
    setLoading(true);

    const response =
      await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          client: formData.get("client"),
          sprId: formData.get("sprId"),
          riskTier:
            formData.get("riskTier"),
          businessOwner:
            formData.get("businessOwner"),
          technicalOwner:
            formData.get("technicalOwner"),
        }),
      });

    setLoading(false);

    if (!response.ok) {
      const body =
        await response.json().catch(
          () => null
        );

      setError(
        body?.error ??
          "Unable to create project"
      );
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 font-semibold text-black hover:bg-cyan-400"
      >
        {open ? (
          <X size={16} />
        ) : (
          <Plus size={16} />
        )}
        {open ? "Close" : "Add New Project"}
      </button>

      {open && (
        <form
          action={createProject}
          className="mt-4 rounded-2xl border border-cyan-500/20 bg-slate-900 p-5"
        >
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">
              Create Security Project Record
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Add an SPR now; scope profiles, SRs, and components can be
              attached afterwards.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <input
              name="name"
              required
              placeholder="Project / application name"
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-200 outline-none focus:border-cyan-400"
            />

            <input
              name="client"
              placeholder="Client / business unit"
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-200 outline-none focus:border-cyan-400"
            />

            <input
              name="sprId"
              placeholder="SPR ID (optional)"
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-200 outline-none focus:border-cyan-400"
            />

            <select
              name="riskTier"
              defaultValue=""
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-200 outline-none focus:border-cyan-400"
            >
              <option value="">Risk tier</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <input
              name="businessOwner"
              placeholder="Business owner"
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-200 outline-none focus:border-cyan-400"
            />

            <input
              name="technicalOwner"
              placeholder="Technical owner"
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-200 outline-none focus:border-cyan-400"
            />
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-cyan-500 px-5 py-2.5 font-semibold text-black hover:bg-cyan-400 disabled:opacity-50"
            >
              {loading
                ? "Creating..."
                : "Create Project"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
