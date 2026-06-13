"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Upload,
} from "lucide-react";

interface ProjectOption {
  id: string;
  name: string;
  sprId?: string | null;
}

export default function ImportUploader({
  projects,
}: {
  projects: ProjectOption[];
}) {
  const [file, setFile] =
    useState<File | null>(null);
  const [projectId, setProjectId] =
    useState(projects[0]?.id ?? "");
  const [loading, setLoading] =
    useState(false);
  const [message, setMessage] =
    useState("");
  const [error, setError] =
    useState("");

  async function upload() {
    if (!file || !projectId) {
      setError(
        "Choose a project and a Burp XML file."
      );
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

    const response = await fetch(
      "/api/import/burp",
      {
        method: "POST",
        body: formData,
      }
    );

    const data =
      await response.json().catch(
        () => null
      );

    setLoading(false);

    if (!response.ok) {
      setError(
        data?.error ??
          "Import failed"
      );
      return;
    }

    setMessage(
      `Imported ${data.imported} findings`
    );
    setFile(null);
  }

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-6">
      <div className="mb-5 flex items-center gap-3">
        <Upload
          size={22}
          className="text-cyan-300"
        />
        <div>
          <h2 className="text-xl font-bold text-white">
            Scanner Import
          </h2>
          <p className="text-sm text-slate-400">
            Import Burp Suite XML into a selected SPR/project.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <select
          value={projectId}
          onChange={(event) =>
            setProjectId(event.target.value)
          }
          className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-300 outline-none focus:border-cyan-400"
        >
          {projects.length === 0 && (
            <option value="">
              No projects available
            </option>
          )}

          {projects.map((project) => (
            <option
              key={project.id}
              value={project.id}
            >
              {project.sprId
                ? `${project.sprId} · ${project.name}`
                : project.name}
            </option>
          ))}
        </select>

        <input
          type="file"
          accept=".xml"
          onChange={(event) =>
            setFile(
              event.target.files?.[0] ??
                null
            )
          }
          className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={loading}
          onClick={upload}
          className="rounded-xl bg-cyan-500 px-5 py-2.5 font-semibold text-black hover:bg-cyan-400 disabled:opacity-50"
        >
          {loading
            ? "Importing..."
            : "Import Findings"}
        </button>

        {message && (
          <div className="flex items-center gap-2 text-sm text-emerald-300">
            <CheckCircle2 size={16} />
            {message}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
